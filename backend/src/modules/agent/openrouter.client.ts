import { config } from '../../config/env.config';

const BASE_URL = 'https://openrouter.ai/api/v1';

/** The three engines the drafting pipeline is allowed to call. */
export const ENGINE = {
  /*
   * 3.7, released 13 August 2026. Same 1M context as 3.6 and exactly half the
   * price — $0.38/M in and $1.88/M out against $0.75 and $3.75 — which matters
   * because Gemini runs the fact-extraction stage, the one that consumes the
   * most input in the pipeline.
   */
  GEMINI: 'google/gemini-3.7-flash',
  GPT: 'openai/gpt-5.6-sol',
  OPUS: 'anthropic/claude-opus-5'
} as const;

export type EngineModel = (typeof ENGINE)[keyof typeof ENGINE];

/** Opus writes whole documents, so it needs far longer than the analysis engines. */
const OPUS_TIMEOUT_MS = 120_000;
const DEFAULT_TIMEOUT_MS = 20_000;
const DEFAULT_MAX_TOKENS = 2048;

/** A response shorter than this is treated as a failed generation, not content. */
const MIN_USABLE_LENGTH = 50;

/**
 * What one model call actually consumed.
 *
 * Reported by OpenRouter, not derived: `cost` is the amount that left the
 * platform's account for this exact request. The pipeline attributes it to the
 * firm that caused it, which is the only way a per-firm balance means anything
 * when every firm draws from one upstream account.
 */
export interface CallUsage {
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
}

export interface CallResult {
  text: string;
  /** Absent when the call failed before producing anything billable. */
  usage: CallUsage | null;
}

const SIN_RESULTADO: CallResult = { text: '', usage: null };

/**
 * Calls one OpenRouter model and returns its text, or an empty string on any
 * failure. Callers are expected to degrade gracefully rather than propagate:
 * the pipeline has a static template fallback for exactly this case.
 *
 * maxTokens is left undefined for Opus so it can emit a complete document;
 * the analysis engines are capped because their output is a short structured
 * summary and an overrun is pure cost.
 */
/**
 * Calls one model and returns its text ALONG WITH what it cost.
 *
 * The cost used to be discarded, so the pipeline reported a hardcoded 4820
 * tokens for every draft it ever produced — a fabricated figure in the one
 * place a firm is charged money. Callers that do not care about billing can
 * still ignore `usage`; the ones that bill cannot invent it.
 */
export const callOpenRouterWithUsage = async (
  model: EngineModel | string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens?: number
): Promise<CallResult> => {
  const apiKey = config.openRouter.apiKey;

  if (!apiKey) {
    console.warn('[OPENROUTER] No API key configured; skipping call.');
    return SIN_RESULTADO;
  }

  const isOpus = model.includes('claude-opus');
  const timeoutMs = isOpus ? OPUS_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
  const resolvedMaxTokens = maxTokens ?? (isOpus ? undefined : DEFAULT_MAX_TOKENS);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    console.log(
      `[OPENROUTER] ${model} (timeout ${timeoutMs / 1000}s, max_tokens ${resolvedMaxTokens ?? 'unlimited'})`
    );

    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://iureon.co',
        'X-Title': 'Iureon LegalTech B2B'
      },
      body: JSON.stringify({
        model,
        /*
         * Medium reasoning effort on Opus, deliberately.
         *
         * Opus bills reasoning tokens like any other output, and the drafting
         * stage it runs already has its structure decided: Gemini extracted the
         * facts and GPT laid out the dogmatic outline. What is left is writing
         * the document well, which is what Opus is for — not re-deriving a plan
         * that already exists. Medium is the level that buys the writing
         * without paying for the re-derivation.
         */
        ...(isOpus ? { reasoning_effort: 'medium' } : {}),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: resolvedMaxTokens,
        /*
         * Without this OpenRouter omits usage.cost, and the platform is left
         * estimating what a call cost from a price table that goes stale every
         * time a provider changes. Asked for on every call because a firm's
         * balance is only honest if it is drawn down by what actually happened.
         */
        usage: { include: true }
      })
    });

    const json: any = await response.json();

    if (json.error) {
      console.warn(`[OPENROUTER] ${model} returned an error:`, json.error.message || json.error);
      return SIN_RESULTADO;
    }

    /*
     * The usage travels even when the text is unusable, because the money left
     * the account either way. A failed generation that is not recorded is a
     * cost the platform absorbs silently and cannot explain later.
     */
    const usage: CallUsage | null = json.usage
      ? {
          model,
          promptTokens: Number(json.usage.prompt_tokens ?? 0),
          completionTokens: Number(json.usage.completion_tokens ?? 0),
          costUsd: Number(json.usage.cost ?? 0)
        }
      : null;

    const text: string = json.choices?.[0]?.message?.content?.trim() ?? '';

    if (text.length > MIN_USABLE_LENGTH) {
      console.log(
        `[OPENROUTER] ${model} responded with ${text.length} characters` +
          (usage ? ` (US$${usage.costUsd.toFixed(6)})` : '')
      );
      return { text, usage };
    }

    // Too short to use, but it was still billed: the usage travels so the cost
    // is recorded even though the text is thrown away.
    return { text: '', usage };
  } catch (err: any) {
    console.warn(`[OPENROUTER] ${model} call failed:`, err.message);
    return SIN_RESULTADO;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * The text alone, for callers that do not bill.
 *
 * Kept so the pipeline's many call sites did not each have to learn about
 * usage on the same day — but every one of them that charges a firm uses
 * `callOpenRouterWithUsage`, because a charge derived from nothing is the
 * hardcoded 4820 all over again.
 */
export const callOpenRouterModel = async (
  model: EngineModel | string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens?: number
): Promise<string> =>
  (await callOpenRouterWithUsage(model, systemPrompt, userPrompt, maxTokens)).text;
