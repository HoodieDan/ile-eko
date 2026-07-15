import type { ZodTypeAny, infer as ZodInfer } from 'zod';
import { env } from '../config/env';
import { logger } from '../config/logger';

/** Thrown when no model is reachable — callers degrade gracefully (never hang). */
export class AIUnavailableError extends Error {
  constructor(message = 'AI is unavailable') {
    super(message);
    this.name = 'AIUnavailableError';
  }
}

export interface GenerateObjectArgs<S extends ZodTypeAny> {
  schema: S;
  system: string;
  prompt: string;
}
export interface GenerateTextArgs {
  system: string;
  prompt: string;
  tools?: Record<string, unknown>;
}

/**
 * The single AI seam (§2, §7). All structured/text generation goes through this
 * interface so the SDK-version surface is isolated to one place and tests can
 * inject a deterministic fake (no live calls in CI).
 */
export interface AIEngine {
  generateObject<S extends ZodTypeAny>(args: GenerateObjectArgs<S>): Promise<ZodInfer<S>>;
  generateText(args: GenerateTextArgs): Promise<string>;
}

/** Default engine: uses the Vercel AI SDK when a key is configured; else unavailable. */
const defaultEngine: AIEngine = {
  async generateObject(args) {
    if (!env_hasKey()) throw new AIUnavailableError('AI_API_KEY not configured');
    try {
      const { generateObject } = (await import('ai')) as typeof import('ai');
      const model = await resolveModel();
      const { object } = await generateObject({
        model,
        schema: args.schema as never,
        system: args.system,
        prompt: args.prompt,
      });
      return object as never;
    } catch (err) {
      logger.warn({ err }, 'AI generateObject failed');
      throw new AIUnavailableError();
    }
  },
  async generateText(args) {
    if (!env_hasKey()) throw new AIUnavailableError('AI_API_KEY not configured');
    try {
      const { generateText } = (await import('ai')) as typeof import('ai');
      const model = await resolveModel();
      const { text } = await generateText({ model, system: args.system, prompt: args.prompt });
      return text;
    } catch (err) {
      logger.warn({ err }, 'AI generateText failed');
      throw new AIUnavailableError();
    }
  },
};

function env_hasKey(): boolean {
  return Boolean(process.env.AI_API_KEY);
}

/** Build the provider model from env (explicit key; not the SDK default lookup). */
async function resolveModel(): Promise<never> {
  const apiKey = process.env.AI_API_KEY as string;
  const modelId = env.NODE_ENV === 'production' ? (process.env.AI_MODEL ?? 'gpt-4o') : (process.env.AI_MODEL ?? 'gpt-4o');
  if ((process.env.AI_PROVIDER ?? 'openai') === 'anthropic') {
    const { createAnthropic } = (await import('@ai-sdk/anthropic')) as typeof import('@ai-sdk/anthropic');
    return createAnthropic({ apiKey })(modelId) as never;
  }
  const { createOpenAI } = (await import('@ai-sdk/openai')) as typeof import('@ai-sdk/openai');
  return createOpenAI({ apiKey })(modelId) as never;
}

let current: AIEngine = defaultEngine;
export function getEngine(): AIEngine {
  return current;
}
/** Test/DI hook: inject a deterministic engine. */
export function setEngine(engine: AIEngine): void {
  current = engine;
}
export function resetEngine(): void {
  current = defaultEngine;
}
