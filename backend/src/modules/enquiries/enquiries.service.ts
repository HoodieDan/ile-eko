import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError';
import { withTxn } from '../../utils/withTxn';
import { Enquiry, Listing, User, type EnquiryDoc } from '../../models';
import { emitEvent } from '../../services/outbox';
import { emitActivity } from '../../services/activityLog';
import type { CreateEnquiryInput, EnquiryDTO, EnquiryInboxDTO } from '../../contracts';

interface Actor {
  userId: string;
  name: string;
}

function toTenantDTO(e: EnquiryDoc): EnquiryDTO {
  const lastReply = e.replies.at(-1);
  return {
    id: e.id,
    tenantUserId: String(e.tenantUserId),
    listingId: String(e.listingId),
    propertyId: String(e.propertyId),
    message: e.message,
    status: e.status as EnquiryDTO['status'],
    createdAt: (e.createdAt as Date).toISOString(),
    ...(lastReply ? { reply: lastReply.body } : {}),
  };
}

export async function createEnquiry(
  tenantUserId: string,
  input: CreateEnquiryInput,
): Promise<EnquiryDTO> {
  if (!Types.ObjectId.isValid(input.listingId)) throw AppError.notFound('Listing not found');
  const listing = await Listing.findById(input.listingId).lean();
  if (!listing) throw AppError.notFound('Listing not found');

  return withTxn(async (session) => {
    const [enquiry] = await Enquiry.create(
      [
        {
          tenantUserId,
          listingId: listing._id,
          propertyId: listing.propertyId,
          landlordId: listing.landlordId,
          message: input.message,
          status: 'new',
        },
      ],
      { session },
    );
    await emitActivity(session, {
      actorId: tenantUserId,
      actorName: 'Tenant',
      landlordId: String(listing.landlordId),
      action: 'enquiry.received',
      propertyId: listing.propertyId,
      entityId: enquiry!._id,
      description: 'New enquiry received',
    });
    await emitEvent(session, {
      type: 'enquiry.received',
      payload: { enquiryId: enquiry!.id, landlordId: String(listing.landlordId) },
      dedupeKey: `enquiry.received:${enquiry!.id}`,
    });
    return toTenantDTO(enquiry!);
  });
}

export async function listInbox(landlordId: string): Promise<{ items: EnquiryInboxDTO[]; unreadCount: number }> {
  const enquiries = await Enquiry.find({ landlordId }).sort({ createdAt: -1 }).limit(100);
  const listingIds = [...new Set(enquiries.map((e) => String(e.listingId)))];
  const listings = await Listing.find({ _id: { $in: listingIds } }, { title: 1 }).lean();
  const titleById = new Map(listings.map((l) => [String(l._id), l.title ?? 'Listing']));
  const tenantIds = [...new Set(enquiries.map((e) => String(e.tenantUserId)))];
  const tenants = await User.find({ _id: { $in: tenantIds } }, { fullName: 1 }).lean();
  const nameById = new Map(tenants.map((t) => [String(t._id), t.fullName]));

  const items: EnquiryInboxDTO[] = enquiries.map((e) => ({
    id: e.id,
    listingId: String(e.listingId),
    targetLabel: titleById.get(String(e.listingId)) ?? 'Listing',
    tenantName: nameById.get(String(e.tenantUserId)) ?? 'Tenant',
    message: e.message,
    snippet: e.message.slice(0, 80),
    read: e.read,
    status: e.status as EnquiryInboxDTO['status'],
    replies: e.replies.map((r) => ({ authorId: String(r.authorId), body: r.body, createdAt: (r.createdAt as Date).toISOString() })),
    createdAt: (e.createdAt as Date).toISOString(),
  }));
  const unreadCount = await Enquiry.countDocuments({ landlordId, read: false });
  return { items, unreadCount };
}

async function ownedEnquiry(landlordId: string, id: string): Promise<EnquiryDoc> {
  if (!Types.ObjectId.isValid(id)) throw AppError.notFound('Enquiry not found');
  const e = await Enquiry.findOne({ _id: id, landlordId });
  if (!e) throw AppError.notFound('Enquiry not found');
  return e;
}

export async function getThread(landlordId: string, id: string): Promise<EnquiryInboxDTO> {
  await ownedEnquiry(landlordId, id);
  const { items } = await listInbox(landlordId);
  const found = items.find((i) => i.id === id);
  if (!found) throw AppError.notFound('Enquiry not found');
  return found;
}

export async function reply(landlordId: string, actor: Actor, id: string, body: string): Promise<void> {
  const enquiry = await ownedEnquiry(landlordId, id);
  await withTxn(async (session) => {
    enquiry.replies.push({ authorId: new Types.ObjectId(actor.userId), body, createdAt: new Date() });
    enquiry.status = 'replied';
    enquiry.read = true;
    await enquiry.save({ session });
    await emitActivity(session, {
      actorId: actor.userId,
      actorName: actor.name,
      landlordId,
      action: 'enquiry.replied',
      propertyId: enquiry.propertyId,
      entityId: enquiry._id,
      description: 'Replied to an enquiry',
    });
    await emitEvent(session, {
      type: 'enquiry.replied',
      payload: { enquiryId: enquiry.id, tenantUserId: String(enquiry.tenantUserId) },
      dedupeKey: `enquiry.replied:${enquiry.id}:${enquiry.replies.length}`,
    });
  });
}

export async function markRead(landlordId: string, id: string): Promise<void> {
  await ownedEnquiry(landlordId, id);
  await Enquiry.updateOne({ _id: id, landlordId }, { $set: { read: true } });
}

export async function listMine(tenantUserId: string): Promise<EnquiryDTO[]> {
  const enquiries = await Enquiry.find({ tenantUserId }).sort({ createdAt: -1 });
  return enquiries.map(toTenantDTO);
}

export async function unreadCount(landlordId: string): Promise<number> {
  return Enquiry.countDocuments({ landlordId, read: false });
}
