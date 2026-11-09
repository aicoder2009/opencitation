/**
 * TypeSafe AI - Jev System One Model Integration
 *
 * Jev is a non-autoregressive System One decision model that returns
 * typed, probabilistic classifications without hallucination.
 *
 * Endpoint: POST https://api.typesafe.ai/v1/systemone
 */

import {
  checkDedicatedBlocklist,
  formatBlockMessage,
  DEFAULT_BLOCK_MESSAGE_TEMPLATE,
  BlockMessageContext,
} from './blocklist';

export interface JevDecisionResult {
  blocked: boolean;
  message?: string;
  category?: string;
  reason?: string;
  confidence?: number;
  probability?: number;
  source: 'blocklist' | 'jev' | 'allowed';
}

interface JevSystemOneResponse {
  answers?: {
    should_block?: {
      value: boolean;
      probability: number;
      confidence: number;
    };
    category?: {
      value: string;
      probability: number;
      confidence: number;
    };
  };
  usage?: {
    total_tokens?: number;
  };
  error?: string;
}

const TYPESAFE_API_URL =
  process.env.TYPESAFE_API_URL || 'https://api.typesafe.ai/v1/systemone';

/**
 * Evaluates whether a URL should be blocked using:
 * 1. Fast static check against the dedicated blocklist.
 * 2. If not on blocklist and TYPESAFE_API_KEY is configured, queries Jev (System One).
 * 3. Returns structured decision + prepared message with `{website url}` interpolation.
 */
export async function evaluateUrlWithJev(
  targetUrl: string,
  options: {
    customTemplate?: string;
    apiKey?: string;
    timeoutMs?: number;
  } = {}
): Promise<JevDecisionResult> {
  let host = '';
  try {
    const parsed = new URL(targetUrl);
    host = parsed.hostname;
  } catch {
    return {
      blocked: true,
      reason: 'Invalid URL format',
      source: 'blocklist',
      message: formatBlockMessage(options.customTemplate || DEFAULT_BLOCK_MESSAGE_TEMPLATE, {
        url: targetUrl,
        host: 'invalid',
        reason: 'Invalid URL format',
        source: 'blocklist',
      }),
    };
  }

  // 1. Check dedicated blocklist first (instant fast-path)
  const blocklistMatch = checkDedicatedBlocklist(host);
  if (blocklistMatch) {
    const ctx: BlockMessageContext = {
      url: targetUrl,
      host,
      reason: blocklistMatch.reason,
      category: blocklistMatch.category,
      source: 'blocklist',
    };
    return {
      blocked: true,
      category: blocklistMatch.category,
      reason: blocklistMatch.reason,
      source: 'blocklist',
      message: formatBlockMessage(options.customTemplate || DEFAULT_BLOCK_MESSAGE_TEMPLATE, ctx),
    };
  }

  // 2. Query Jev (TypeSafe AI) if API key is provided
  const apiKey = options.apiKey || process.env.TYPESAFE_API_KEY;
  if (!apiKey) {
    // If Jev is not configured, domain is allowed past the blocklist
    return {
      blocked: false,
      source: 'allowed',
    };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), options.timeoutMs || 3000);

    const payload = {
      model: 'jev-latest',
      state: `Target URL: ${targetUrl}\nHost: ${host}\nContext: Academic citation lookup service. Assessing whether this site is an interactive AI chatbot, paywalled API, or disallowed web service.`,
      questions: {
        should_block: {
          type: 'noul',
          statement: 'This website is an interactive AI chat interface, paywalled interactive app, or restricted scraper destination that cannot be cited as a static document.',
        },
        category: {
          type: 'choice',
          options: ['ai_chat_interface', 'interactive_spa', 'paywalled_api', 'static_web_page', 'scholarly_resource'],
        },
      },
    };

    const response = await fetch(TYPESAFE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      console.warn(`Jev API returned status ${response.status}`);
      return { blocked: false, source: 'allowed' };
    }

    const data: JevSystemOneResponse = await response.json();
    const shouldBlock = data.answers?.should_block;
    const categoryAnswer = data.answers?.category;

    // Evaluate Jev decision based on calibrated probability threshold (> 0.8)
    if (shouldBlock && shouldBlock.value && shouldBlock.confidence >= 0.75) {
      const reason =
        categoryAnswer?.value === 'ai_chat_interface'
          ? 'Interactive AI chat application'
          : categoryAnswer?.value === 'interactive_spa'
          ? 'Interactive single-page app without citable article content'
          : 'Restricted domain per policy';

      const ctx: BlockMessageContext = {
        url: targetUrl,
        host,
        reason,
        category: categoryAnswer?.value || 'restricted',
        confidence: shouldBlock.confidence,
        source: 'jev',
      };

      return {
        blocked: true,
        reason,
        category: categoryAnswer?.value,
        confidence: shouldBlock.confidence,
        probability: shouldBlock.probability,
        source: 'jev',
        message: formatBlockMessage(options.customTemplate || DEFAULT_BLOCK_MESSAGE_TEMPLATE, ctx),
      };
    }

    return {
      blocked: false,
      confidence: shouldBlock?.confidence,
      source: 'allowed',
    };
  } catch (err) {
    // If Jev fails or times out, fail-open gracefully so citation lookup continues
    console.error('Error consulting Jev for URL moderation:', err);
    return {
      blocked: false,
      source: 'allowed',
    };
  }
}
