import { createHash } from 'node:crypto';
import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError';
import { Listing, ListingView, SavedListing, type ListingDoc } from '../../models';
import { urlsFor } from '../../services/storage';
import type {
  ListingDetail,
  ListingFilters,
  ListingSummary,
  ParsedSearchFilters,
} from '../../contracts';

function summary(l: ListingDoc): ListingSummary {
  return {
    id: l.id,
    propertyId: String(l.propertyId),
    ...(l.unitId ? { unitId: String(l.unitId) } : {}),
    title: l.title ?? '',
    area: l.area ?? '',
    lga: l.lga ?? '',
    rent: l.rent ?? 0,
    beds: l.beds ?? 0,
    baths: l.baths ?? 0,
    size: l.size ?? 0,
    type: l.type ?? '',
    verified: Boolean(l.verified),
    amenities: l.amenities ?? [],
    landlordName: l.landlordName ?? '',
    ...(l.listedAt ? { listedAt: (l.listedAt as Date).toISOString() } : {}),
  };
}

function detail(l: ListingDoc): ListingDetail {
  return { ...summary(l), description: l.description ?? '', images: urlsFor(l.images) };
}

function buildQuery(filters: ParsedSearchFilters & ListingFilters): Record<string, unknown> {
  const q: Record<string, unknown> = { listed: true, available: true };
  if (filters.area) q.area = new RegExp(filters.area, 'i');
  if (filters.lga) q.lga = new RegExp(filters.lga, 'i');
  const maxPrice = filters.maxPrice;
  if (maxPrice) q.rent = { $lte: maxPrice };
  const beds = (filters as ListingFilters).beds ?? (filters as ParsedSearchFilters).minBeds;
  if (beds) q.beds = { $gte: beds };
  if (filters.amenities?.length) q.amenities = { $all: filters.amenities };
  if (filters.q) q.$text = { $search: filters.q };
  return q;
}

/** Merge personalized saved/recommended flags for an authed tenant. */
async function personalize(items: ListingSummary[], tenantUserId?: string, recommendedIds?: Set<string>): Promise<ListingSummary[]> {
  if (!tenantUserId) return items;
  const saved = await SavedListing.find({ tenantUserId }, { listingId: 1 }).lean();
  const savedSet = new Set(saved.map((s) => String(s.listingId)));
  return items.map((i) => ({
    ...i,
    saved: savedSet.has(i.id),
    ...(recommendedIds ? { recommended: recommendedIds.has(i.id) } : {}),
  }));
}

export async function listListings(
  filters: ParsedSearchFilters & ListingFilters,
  tenantUserId?: string,
): Promise<ListingSummary[]> {
  const docs = await Listing.find(buildQuery(filters)).sort({ listedAt: -1 }).limit(60);
  return personalize(docs.map(summary), tenantUserId);
}

export async function getListing(id: string, tenantUserId?: string): Promise<ListingDetail> {
  if (!Types.ObjectId.isValid(id)) throw AppError.notFound('Listing not found');
  const doc = await Listing.findOne({ _id: id, listed: true });
  if (!doc) throw AppError.notFound('Listing not found');
  const d = detail(doc);
  if (tenantUserId) {
    const saved = await SavedListing.findOne({ tenantUserId, listingId: doc._id }).lean();
    d.saved = Boolean(saved);
  }
  return d;
}

/** Record a view (deduped per viewerKey), incrementing on first insert only (§5.14). */
export async function recordView(listingId: string, viewerKey: string, userId?: string): Promise<void> {
  if (!Types.ObjectId.isValid(listingId)) return;
  const hashed = createHash('sha256').update(`${viewerKey}::ile-eko`).digest('hex');
  try {
    await ListingView.create({ listingId, viewerKey: hashed, ...(userId ? { userId } : {}) });
    await Listing.updateOne({ _id: listingId }, { $inc: { views: 1 } });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return; // already counted this viewer
    throw err;
  }
}

export async function toggleListing(landlordId: string, id: string, listed: boolean): Promise<ListingSummary> {
  if (!Types.ObjectId.isValid(id)) throw AppError.notFound('Listing not found');
  const doc = await Listing.findOne({ _id: id, landlordId });
  if (!doc) throw AppError.notFound('Listing not found');
  if (listed && !doc.available) throw AppError.conflict('Cannot list an occupied target');
  doc.listed = listed;
  doc.listedAt = listed ? new Date() : doc.listedAt;
  await doc.save();
  return summary(doc);
}

/** Landlord-facing listing rows for a property (for the toggle + stats on detail). */
export async function listingsForProperty(landlordId: string, propertyId: string) {
  const docs = await Listing.find({ landlordId, propertyId }).lean();
  return docs.map((l) => ({
    id: String(l._id),
    ...(l.unitId ? { unitId: String(l.unitId) } : {}),
    listed: Boolean(l.listed),
    available: Boolean(l.available),
    views: l.views ?? 0,
  }));
}

export { summary as toSummary };
