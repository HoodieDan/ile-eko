import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError';
import { withTxn } from '../../utils/withTxn';
import { Lease, Listing, Property, Unit, type UnitDoc } from '../../models';
import { emitActivity } from '../../services/activityLog';
import { refreshListingProjection } from '../../services/listingProjection';
import { recomputePropertyStatus } from '../../services/occupancy';
import { presentUnit } from '../../presenters/entities';
import type { CreateUnitInput, UnitDTO, UpdateUnitInput } from '../../contracts';

interface Actor {
  userId: string;
  name: string;
}

async function ownedProperty(landlordId: string, propertyId: string) {
  if (!Types.ObjectId.isValid(propertyId)) throw AppError.notFound('Property not found');
  const property = await Property.findOne({ _id: propertyId, landlordId, archivedAt: { $exists: false } });
  if (!property) throw AppError.notFound('Property not found');
  return property;
}

async function ownedUnit(landlordId: string, unitId: string): Promise<UnitDoc> {
  if (!Types.ObjectId.isValid(unitId)) throw AppError.notFound('Unit not found');
  const unit = await Unit.findOne({ _id: unitId, archivedAt: { $exists: false } });
  if (!unit) throw AppError.notFound('Unit not found');
  const property = await Property.findOne({ _id: unit.propertyId, landlordId });
  if (!property) throw AppError.notFound('Unit not found');
  return unit;
}

export async function listUnits(landlordId: string, propertyId: string): Promise<UnitDTO[]> {
  await ownedProperty(landlordId, propertyId);
  const units = await Unit.find({ propertyId, archivedAt: { $exists: false } }).sort({ createdAt: 1 });
  return units.map(presentUnit);
}

export async function createUnit(
  landlordId: string,
  actor: Actor,
  propertyId: string,
  input: CreateUnitInput,
): Promise<UnitDTO> {
  const property = await ownedProperty(landlordId, propertyId);
  return withTxn(async (session) => {
    const [unit] = await Unit.create(
      [{ ...input, unitNumber: input.label, propertyId: property._id, statusCache: 'vacant' }],
      { session },
    );
    if (!property.hasUnits) {
      property.hasUnits = true;
      await property.save({ session });
    }
    await refreshListingProjection(session, property.id, unit!.id, true);
    await recomputePropertyStatus(session, property.id);
    await emitActivity(session, {
      actorId: actor.userId,
      actorName: actor.name,
      landlordId,
      action: 'unit.created',
      propertyId: property._id,
      entityId: unit!._id,
      description: `Unit "${unit!.unitNumber}" added`,
    });
    return presentUnit(unit!);
  });
}

export async function updateUnit(
  landlordId: string,
  actor: Actor,
  unitId: string,
  input: UpdateUnitInput,
): Promise<UnitDTO> {
  const unit = await ownedUnit(landlordId, unitId);
  return withTxn(async (session) => {
    const { label, ...rest } = input;
    Object.assign(unit, rest);
    if (label) unit.unitNumber = label;
    await unit.save({ session });
    await refreshListingProjection(session, String(unit.propertyId), unit.id, unit.statusCache === 'vacant');
    await emitActivity(session, {
      actorId: actor.userId,
      actorName: actor.name,
      landlordId,
      action: 'unit.updated',
      propertyId: unit.propertyId,
      entityId: unit._id,
      description: `Unit "${unit.unitNumber}" updated`,
    });
    return presentUnit(unit);
  });
}

export async function archiveUnit(landlordId: string, actor: Actor, unitId: string): Promise<void> {
  const unit = await ownedUnit(landlordId, unitId);
  const active = await Lease.findOne({ unitId: unit._id, status: 'active' }).lean();
  if (active) throw AppError.conflict('Cannot remove a unit with an active lease');
  await withTxn(async (session) => {
    unit.set('archivedAt', new Date());
    await unit.save({ session });
    await Listing.updateOne({ propertyId: unit.propertyId, unitId: unit._id }, { $set: { listed: false, available: false } }, { session });
    await recomputePropertyStatus(session, String(unit.propertyId));
    await emitActivity(session, {
      actorId: actor.userId,
      actorName: actor.name,
      landlordId,
      action: 'unit.updated',
      propertyId: unit.propertyId,
      entityId: unit._id,
      description: `Unit "${unit.unitNumber}" removed`,
    });
  });
}
