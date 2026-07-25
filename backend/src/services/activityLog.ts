import type { ClientSession } from 'mongoose';
import { ActivityLog } from '../models';
import { categoryFor, type ActivityAction } from '../contracts';

/** Any id-like value (string, ObjectId instance, or the mis-typed ObjectId ctor). */
type IdLike = string | { toString(): string };
const asId = (v: IdLike): string => String(v);

export interface EmitActivityInput {
  actorId: IdLike;
  actorName: string;
  landlordId: IdLike;
  action: ActivityAction;
  propertyId?: IdLike;
  entityId?: IdLike;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

/** Write an audit row in the same transaction as the state change (§8). */
export async function emitActivity(
  session: ClientSession,
  input: EmitActivityInput,
): Promise<void> {
  await ActivityLog.create(
    [
      {
        actorId: asId(input.actorId),
        actorName: input.actorName,
        landlordId: asId(input.landlordId),
        action: input.action,
        category: categoryFor(input.action),
        ...(input.propertyId ? { propertyId: asId(input.propertyId) } : {}),
        ...(input.entityId ? { entityId: asId(input.entityId) } : {}),
        description: input.description,
        ...(input.metadata ? { metadata: input.metadata } : {}),
        ...(input.ipAddress ? { ipAddress: input.ipAddress } : {}),
        createdAt: new Date(),
      },
    ],
    { session },
  );
}
