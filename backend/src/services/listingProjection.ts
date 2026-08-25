import type { ClientSession } from 'mongoose';
import { Listing, Property, Unit, User, type PropertyDoc, type UnitDoc } from '../models';

/** Build the materialized searchable fields for a listing target (§5.3a). */
export async function refreshListingProjection(
  session: ClientSession,
  propertyId: string,
  unitId: string | null,
  available: boolean,
): Promise<void> {
  const property = await Property.findById(propertyId).session(session);
  if (!property) return;
  const landlord = await User.findById(property.landlordId).session(session);
  const unit: UnitDoc | null = unitId ? await Unit.findById(unitId).session(session) : null;

  const beds = unit?.bedrooms ?? property.bedrooms ?? 0;
  const baths = unit?.bathrooms ?? property.bathrooms ?? 0;
  const size = unit?.sizeSqm ?? property.sizeSqm ?? 0;
  const rent = unit?.rentAmount ?? property.rentAmount ?? 0;
  const amenities = unit?.amenities?.length ? unit.amenities : (property.amenities ?? []);
  const images = unit?.images?.length ? unit.images : (property.images ?? []);
  const title = unit
    ? `${property.propertyTitle} · Unit ${unit.unitNumber}`
    : property.propertyTitle;
  const searchText =
    `${title} ${property.area} ${property.lga} ${property.description}`.toLowerCase();

  await Listing.updateOne(
    { propertyId, unitId: unitId ?? { $exists: false } },
    {
      $set: {
        landlordId: property.landlordId,
        available,
        verified: property.verified,
        title,
        area: property.area,
        lga: property.lga,
        type: property.propertyType,
        rent,
        beds,
        baths,
        size,
        amenities,
        images,
        description: property.description,
        landlordName: landlord?.fullName ?? '',
        searchText,
      },
      $setOnInsert: {
        propertyId: property._id,
        ...(unitId ? { unitId } : {}),
        listed: false,
        views: 0,
      },
    },
    { upsert: true, session },
  );
}

/** Ensure a listing row exists for every rentable target of a property. */
export async function ensureListingsForProperty(
  session: ClientSession,
  property: PropertyDoc,
): Promise<void> {
  if (property.hasUnits) {
    const units = await Unit.find({
      propertyId: property._id,
      archivedAt: { $exists: false },
    }).session(session);
    for (const u of units) {
      await refreshListingProjection(session, property.id, u.id, u.statusCache === 'vacant');
    }
  } else {
    await refreshListingProjection(session, property.id, null, property.statusCache === 'vacant');
  }
}
