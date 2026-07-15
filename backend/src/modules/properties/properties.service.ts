import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError';
import { withTxn } from '../../utils/withTxn';
import { Property, Unit, type PropertyDoc } from '../../models';
import { emitActivity } from '../../services/activityLog';
import { ensureListingsForProperty, refreshListingProjection } from '../../services/listingProjection';
import { presentProperty } from '../../presenters/entities';
import type {
  CreatePropertyInput,
  PropertyDTO,
  PropertyStats,
  UpdatePropertyInput,
} from '../../contracts';

interface Actor {
  userId: string;
  name: string;
}

async function unitCountFor(propertyId: string): Promise<number> {
  return Unit.countDocuments({ propertyId, archivedAt: { $exists: false } });
}

async function ownedProperty(landlordId: string, id: string): Promise<PropertyDoc> {
  if (!Types.ObjectId.isValid(id)) throw AppError.notFound('Property not found');
  const property = await Property.findOne({ _id: id, landlordId, archivedAt: { $exists: false } });
  if (!property) throw AppError.notFound('Property not found');
  return property;
}

export async function listProperties(
  landlordId: string,
  filters: { status?: string; area?: string; q?: string },
): Promise<PropertyDTO[]> {
  const query: Record<string, unknown> = { landlordId, archivedAt: { $exists: false } };
  if (filters.status) query.statusCache = filters.status;
  if (filters.area) query.area = new RegExp(filters.area, 'i');
  if (filters.q) query.$text = { $search: filters.q };

  const properties = await Property.find(query).sort({ createdAt: -1 });
  const dtos = await Promise.all(
    properties.map(async (p) => presentProperty(p, await unitCountFor(p.id))),
  );
  return dtos;
}

export async function propertyStats(landlordId: string): Promise<PropertyStats> {
  const rows = await Property.aggregate([
    { $match: { landlordId: new Types.ObjectId(landlordId), archivedAt: { $exists: false } } },
    { $group: { _id: '$statusCache', count: { $sum: 1 } } },
  ]);
  const stats: PropertyStats = { all: 0, occupied: 0, vacant: 0, partial: 0 };
  for (const r of rows) {
    stats.all += r.count;
    if (r._id === 'occupied') stats.occupied = r.count;
    if (r._id === 'vacant') stats.vacant = r.count;
    if (r._id === 'partial') stats.partial = r.count;
  }
  return stats;
}

export async function getProperty(landlordId: string, id: string): Promise<PropertyDTO> {
  const property = await ownedProperty(landlordId, id);
  return presentProperty(property, await unitCountFor(property.id));
}

export async function createProperty(
  landlordId: string,
  actor: Actor,
  input: CreatePropertyInput,
): Promise<PropertyDTO> {
  return withTxn(async (session) => {
    const [property] = await Property.create(
      [{ ...input, landlordId, statusCache: 'vacant' }],
      { session },
    );
    // Standalone property → create its listing projection (unlisted, available).
    if (!property!.hasUnits) {
      await refreshListingProjection(session, property!.id, null, true);
    }
    await emitActivity(session, {
      actorId: actor.userId,
      actorName: actor.name,
      landlordId,
      action: 'property.created',
      propertyId: property!._id,
      entityId: property!._id,
      description: `Property "${property!.propertyTitle}" added`,
    });
    return presentProperty(property!, 0);
  });
}

export async function updateProperty(
  landlordId: string,
  actor: Actor,
  id: string,
  input: UpdatePropertyInput,
): Promise<PropertyDTO> {
  const property = await ownedProperty(landlordId, id);
  return withTxn(async (session) => {
    Object.assign(property, input);
    await property.save({ session });
    await ensureListingsForProperty(session, property); // keep materialized projection fresh
    await emitActivity(session, {
      actorId: actor.userId,
      actorName: actor.name,
      landlordId,
      action: 'property.updated',
      propertyId: property._id,
      entityId: property._id,
      description: `Property "${property.propertyTitle}" updated`,
    });
    return presentProperty(property, await unitCountFor(property.id));
  });
}

export async function archiveProperty(landlordId: string, actor: Actor, id: string): Promise<void> {
  const property = await ownedProperty(landlordId, id);
  // Block if any unit/target has an active lease (§15 lifecycle).
  const { Lease } = await import('../../models');
  const active = await Lease.findOne({ propertyId: property._id, status: 'active' }).lean();
  if (active) throw AppError.conflict('Cannot archive a property with an active lease');

  await withTxn(async (session) => {
    property.set('archivedAt', new Date());
    await property.save({ session });
    await Unit.updateMany({ propertyId: property._id }, { $set: { archivedAt: new Date() } }, { session });
    const { Listing } = await import('../../models');
    await Listing.updateMany({ propertyId: property._id }, { $set: { listed: false, available: false } }, { session });
    await emitActivity(session, {
      actorId: actor.userId,
      actorName: actor.name,
      landlordId,
      action: 'property.archived',
      propertyId: property._id,
      entityId: property._id,
      description: `Property "${property.propertyTitle}" archived`,
    });
  });
}
