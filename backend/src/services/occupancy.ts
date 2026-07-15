import type { ClientSession } from 'mongoose';
import { Lease, Property, Unit } from '../models';

/**
 * Recompute a property's derived occupancy (§5.2). For a multi-unit property it
 * aggregates its units; for a standalone property it reflects its own active lease.
 * Called synchronously inside the lease transaction — never deferred.
 */
export async function recomputePropertyStatus(
  session: ClientSession,
  propertyId: string,
): Promise<void> {
  const property = await Property.findById(propertyId).session(session);
  if (!property) return;

  if (property.hasUnits) {
    const units = await Unit.find({ propertyId, archivedAt: { $exists: false } }).session(session);
    if (units.length === 0) {
      property.statusCache = 'vacant';
    } else {
      const occupied = units.filter((u) => u.statusCache === 'occupied').length;
      property.statusCache =
        occupied === 0 ? 'vacant' : occupied === units.length ? 'occupied' : 'partial';
    }
  } else {
    const active = await Lease.findOne({ propertyId, unitId: { $exists: false }, status: 'active' })
      .session(session)
      .lean();
    property.statusCache = active ? 'occupied' : 'vacant';
  }
  await property.save({ session });
}

/** Set a target (unit or standalone property) occupancy from a lease start/end. */
export async function setTargetOccupancy(
  session: ClientSession,
  propertyId: string,
  unitId: string | null,
  occupied: boolean,
): Promise<void> {
  if (unitId) {
    await Unit.updateOne(
      { _id: unitId },
      { $set: { statusCache: occupied ? 'occupied' : 'vacant' } },
      { session },
    );
  }
  await recomputePropertyStatus(session, propertyId);
}
