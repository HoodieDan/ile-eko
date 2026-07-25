import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

/** TaskRun (§5.15) — scheduled-job idempotency (e.g. 'daily-sweep:2026-07-15'). */
const taskRunSchema = new Schema(
  { taskKey: { type: String, required: true }, createdAt: { type: Date, default: Date.now } },
  { timestamps: false },
);
taskRunSchema.index({ taskKey: 1 }, { unique: true });

export type TaskRunDoc = HydratedDocument<InferSchemaType<typeof taskRunSchema>>;
export const TaskRun = model('TaskRun', taskRunSchema);
