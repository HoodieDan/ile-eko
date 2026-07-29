import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import { AppError } from '../../utils/AppError';
import { AIConversation, Listing, Property, RentObligation, type ConversationDoc } from '../../models';
import { getEngine, AIUnavailableError } from '../../ai/engine';
import { withRetry } from '../../ai/retry';
import { summaryNumbers, upcomingRent } from '../../services/stats';
import { BriefingObject, RentSuggestionObject } from '../../contracts';
import type { AIConversationDTO, BriefDTO, BriefingDTO, ChatResponse, RentSuggestionDTO } from '../../contracts';

const naira = (n: number) => `₦${n.toLocaleString()}`;

function presentConversation(c: ConversationDoc): AIConversationDTO {
  return {
    id: c.id,
    userId: String(c.userId),
    title: c.title,
    messages: c.messages.map((m) => ({
      id: m.id,
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
      createdAt: (m.createdAt as Date).toISOString(),
    })),
    createdAt: (c.createdAt as Date).toISOString(),
    updatedAt: (c.updatedAt as Date).toISOString(),
  };
}

/** Portfolio grounding, scoped to THIS landlord only (cross-tenant isolation, §7.1). */
async function portfolioContext(landlordId: string): Promise<string> {
  const s = await summaryNumbers(landlordId);
  const upcoming = await upcomingRent(landlordId, 5);
  const lines = [
    `Occupancy: ${s.occupied}/${s.total} targets (${s.occupancyPct}%).`,
    `Annual rent roll: ${naira(s.rollAnnual)}. Collected: ${naira(s.collected)}.`,
    `Overdue: ${naira(s.overdueAmt)}. Due soon: ${naira(s.dueAmt)}. Vacant value: ${naira(s.vacantAmt)}.`,
    ...upcoming.map((u) => `- ${u.tenantName} @ ${u.propertyTitle}: ${naira(u.amount)} ${u.status} (due ${u.dueDate}).`),
  ];
  return lines.join('\n');
}

/** POST /ai/chat — buffered JSON (the client can't stream). Grounded, tenant-isolated. */
export async function chat(userId: string, message: string, conversationId?: string): Promise<ChatResponse> {
  let convo: ConversationDoc | null = conversationId
    ? await AIConversation.findOne({ _id: conversationId, userId })
    : null;
  if (!convo) {
    convo = await AIConversation.create({ userId, title: message.slice(0, 40) });
  }

  convo.messages.push({ id: randomUUID(), role: 'user', content: message, createdAt: new Date() });

  let reply: string;
  let degraded = false;
  try {
    const context = await portfolioContext(userId);
    const history = convo.messages
      .slice(-8)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');
    reply = await withRetry(() =>
      getEngine().generateText({
        system:
          'You are the Ilé Èkó AI property manager for a single Lagos landlord. Answer only from the provided portfolio data. Be concise, use Naira. If data is missing, say so.',
        prompt: `PORTFOLIO:\n${context}\n\nCONVERSATION:\n${history}\n\nAnswer the latest user message.`,
      }),
    );
  } catch (err) {
    if (!(err instanceof AIUnavailableError)) throw err;
    reply = "I couldn't reach the assistant just now — please try again.";
    degraded = true;
  }

  convo.messages.push({ id: randomUUID(), role: 'assistant', content: reply, createdAt: new Date() });
  convo.set('model', process.env.AI_MODEL ?? 'gpt-4o');
  await convo.save();

  return { conversationId: convo.id, message: reply, ...(degraded ? { degraded } : {}) };
}

export async function listConversations(userId: string): Promise<AIConversationDTO[]> {
  const convos = await AIConversation.find({ userId }).sort({ updatedAt: -1 }).limit(50);
  return convos.map(presentConversation);
}

export async function getConversation(userId: string, id: string): Promise<AIConversationDTO> {
  if (!Types.ObjectId.isValid(id)) throw AppError.notFound('Conversation not found');
  const convo = await AIConversation.findOne({ _id: id, userId });
  if (!convo) throw AppError.notFound('Conversation not found');
  return presentConversation(convo);
}

/** GET /ai/briefing — narrate computed numbers (never invent). Deterministic fallback. */
export async function briefing(landlordId: string): Promise<BriefingDTO> {
  const s = await summaryNumbers(landlordId);
  const actionCount = (s.overdueAmt > 0 ? 1 : 0) + (s.vacantAmt > 0 ? 1 : 0);
  const deterministic: BriefingDTO = {
    headline:
      s.overdueAmt > 0
        ? `${naira(s.overdueAmt)} in rent is overdue`
        : `Portfolio is ${s.occupancyPct}% occupied`,
    points: [
      `Collected ${naira(s.collected)} of ${naira(s.rollAnnual)} annual roll.`,
      `${s.occupied}/${s.total} targets occupied.`,
      ...(s.overdueAmt > 0 ? [`${naira(s.overdueAmt)} overdue — follow up.`] : []),
      ...(s.vacantAmt > 0 ? [`${naira(s.vacantAmt)} of rent is sitting vacant.`] : []),
    ],
    actionCount,
  };

  if (!process.env.AI_API_KEY) return { ...deterministic, degraded: true };
  try {
    const obj = await withRetry(() =>
      getEngine().generateObject({
        schema: BriefingObject,
        system:
          'Narrate and prioritize the landlord metrics into a briefing for a Lagos landlord. ' +
          'Do not invent numbers. All amounts are Nigerian Naira — always format them with the ' +
          '₦ symbol (e.g. ₦900,000), never $ or USD. Keep each point to one short sentence.',
        prompt: JSON.stringify(s),
      }),
    );
    return obj;
  } catch {
    return { ...deterministic, degraded: true };
  }
}

/** GET /ai/briefs — proactive cards derived from data (deterministic). */
export async function briefs(landlordId: string): Promise<BriefDTO[]> {
  const now = new Date();
  const overdue = await RentObligation.countDocuments({
    landlordId,
    settlement: { $ne: 'paid' },
    dueDate: { $lt: now },
  });
  const s = await summaryNumbers(landlordId);
  const cards: BriefDTO[] = [];
  if (overdue > 0) {
    cards.push({ kind: 'overdue', title: 'Overdue rent', body: `${overdue} payment(s) overdue.`, deepLink: 'ileeko://payments' });
  }
  if (s.vacantAmt > 0) {
    cards.push({ kind: 'occupancy', title: 'Vacant units', body: `${naira(s.vacantAmt)} of rent is vacant.`, deepLink: 'ileeko://properties' });
  }
  return cards;
}

/** GET /properties/:id/rent-suggestion — comparables + generateObject; heuristic fallback (§7.3). */
export async function rentSuggestion(landlordId: string, propertyId: string): Promise<RentSuggestionDTO> {
  if (!Types.ObjectId.isValid(propertyId)) throw AppError.notFound('Property not found');
  const property = await Property.findOne({ _id: propertyId, landlordId });
  if (!property) throw AppError.notFound('Property not found');

  const currentRent = property.rentAmount ?? 0;
  const comps = await Listing.find(
    { area: property.area, type: property.propertyType, _id: { $ne: propertyId } },
    { area: 1, rent: 1 },
  )
    .limit(10)
    .lean();
  const comparables = comps.map((c) => ({ area: c.area ?? property.area, rent: c.rent ?? 0 })).filter((c) => c.rent > 0);
  const median = comparables.length
    ? [...comparables.map((c) => c.rent)].sort((a, b) => a - b)[Math.floor(comparables.length / 2)]!
    : currentRent;

  const heuristic: RentSuggestionDTO = {
    suggestedRent: median || currentRent,
    rationale: comparables.length
      ? `Based on ${comparables.length} comparable ${property.propertyType} listings in ${property.area}.`
      : 'Not enough comparable listings; showing current rent.',
    deltaPct: currentRent ? Math.round(((median - currentRent) / currentRent) * 1000) / 10 : 0,
    comparables,
    degraded: comparables.length === 0,
  };

  if (!process.env.AI_API_KEY || comparables.length === 0) return { ...heuristic, degraded: true };
  try {
    const obj = await withRetry(() =>
      getEngine().generateObject({
        schema: RentSuggestionObject,
        system:
          'Suggest a fair annual rent (integer Naira) from the target and comparables. ' +
          'Return a short rationale. Amounts are Nigerian Naira — write them with ₦, never $.',
        prompt: JSON.stringify({ target: { area: property.area, type: property.propertyType, currentRent }, comparables }),
      }),
    );
    const deltaPct = currentRent ? Math.round(((obj.suggestedRent - currentRent) / currentRent) * 1000) / 10 : 0;
    return { ...obj, deltaPct, comparables };
  } catch {
    return { ...heuristic, degraded: true };
  }
}
