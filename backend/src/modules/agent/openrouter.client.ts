import { config } from '../../config/env.config';

const BASE_URL = 'https://openrouter.ai/api/v1';

/** The three engines the drafting pipeline is allowed to call. */
export const ENGINE = {
  GEMINI: 'google/gemini-3.6-flash',
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
 * Calls one OpenRouter model and returns its text, or an empty string on any
 * failure. Callers are expected to degrade gracefully rather than propagate:
 * the pipeline has a static template fallback for exactly this case.
 *
 * maxTokens is left undefined for Opus so it can emit a complete document;
 * the analysis engines are capped because their output is a short structured
 * summary and an overrun is pure cost.
 */
export const callOpenRouterModel = async (
  model: EngineModel | string,
  systemPrompt: string,
  userPrompt: string,
  maxTokens?: number
): Promise<string> => {
  const apiKey = config.openRouter.apiKey;

  if (!apiKey) {
    console.warn('[OPENROUTER] No API key configured; skipping call.');
    return '';
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
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: resolvedMaxTokens
      })
    });

    const json: any = await response.json();

    if (json.error) {
      console.warn(`[OPENROUTER] ${model} returned an error:`, json.error.message || json.error);
      return '';
    }

    const text: string = json.choices?.[0]?.message?.content?.trim() ?? '';

    if (text.length > MIN_USABLE_LENGTH) {
      console.log(`[OPENROUTER] ${model} responded with ${text.length} characters.`);
      return text;
    }

    return '';
  } catch (err: any) {
    console.warn(`[OPENROUTER] ${model} call failed:`, err.message);
    return '';
  } finally {
    clearTimeout(timeoutId);
  }
};
