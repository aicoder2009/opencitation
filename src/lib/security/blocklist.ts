/**
 * Dedicated Blocklist & URL Moderation Policy
 *
 * Provides static blocklist rules, pattern matching, and formatted block messages
 * with interpolated variables like {url}, {host}, {reason}, and {confidence}.
 */

export interface BlocklistRule {
  domain: string;
  reason: string;
  category: 'ai_chat' | 'malicious' | 'paywall' | 'policy';
}

/**
 * Dedicated list of known blocked domains and services.
 */
export const DEDICATED_BLOCKLIST: BlocklistRule[] = [
  // Interactive AI chat web applications (unsuitable for scraping / static citation)
  { domain: 'chat.openai.com', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'chatgpt.com', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'claude.ai', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'gemini.google.com', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'bard.google.com', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'copilot.microsoft.com', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'perplexity.ai', reason: 'Interactive AI search interface', category: 'ai_chat' },
  { domain: 'poe.com', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'character.ai', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'chat.deepseek.com', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'deepseek.com', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'grok.com', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'x.com', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'meta.ai', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'you.com', reason: 'Interactive AI search interface', category: 'ai_chat' },
  { domain: 'phind.com', reason: 'Interactive AI search interface', category: 'ai_chat' },
  { domain: 'chat.mistral.ai', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'huggingchat.com', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'pi.ai', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'copilot.com', reason: 'Interactive AI chat interface', category: 'ai_chat' },
  { domain: 'labs.perplexity.ai', reason: 'Interactive AI chat interface', category: 'ai_chat' },
];

// Exact-host index keeps common lookups constant-time. A rule for example.com
// intentionally acts like *.example.com too, while also matching the root.
// This avoids wildcard strings and prevents partial lookalikes from matching.
const BLOCKLIST_BY_DOMAIN = new Map(DEDICATED_BLOCKLIST.map((rule) => [rule.domain, rule]));

export interface BlockMessageContext {
  url: string;
  host: string;
  reason?: string;
  category?: string;
  confidence?: number;
  source?: 'blocklist' | 'jev';
}

/**
 * Default message template with variables:
 * - {url}: Full website URL
 * - {host}: Domain hostname
 * - {reason}: Specific reason for blocking
 * - {confidence}: Confidence percentage (when evaluated by Jev)
 * - {source}: Source of detection (blocklist or Jev)
 */
export const DEFAULT_BLOCK_MESSAGE_TEMPLATE =
  'Sorry, {url} is blocked. Reason: {reason}.';

export const DETAILED_BLOCK_MESSAGE_TEMPLATE =
  'Sorry, {url} ({host}) is blocked from lookup ({reason}). Evaluated by: {source}{confidenceDetail}.';

/**
 * Formats a block message by substituting template variables.
 */
export function formatBlockMessage(
  template: string,
  context: BlockMessageContext
): string {
  const confidencePercent =
    context.confidence !== undefined
      ? `${Math.round(context.confidence * 100)}%`
      : 'N/A';

  const confidenceDetail =
    context.confidence !== undefined
      ? ` with ${confidencePercent} confidence`
      : '';

  return template
    .replace(/\{url\}/g, context.url)
    .replace(/\{website url\}/g, context.url)
    .replace(/\{host\}/g, context.host)
    .replace(/\{reason\}/g, context.reason || 'Restricted domain policy')
    .replace(/\{category\}/g, context.category || 'restricted')
    .replace(/\{confidence\}/g, confidencePercent)
    .replace(/\{confidenceDetail\}/g, confidenceDetail)
    .replace(/\{source\}/g, context.source || 'policy');
}

/**
 * Checks if a given hostname matches an entry in the dedicated blocklist.
 */
export function checkDedicatedBlocklist(host: string): BlocklistRule | null {
  const normalized = host.toLowerCase().trim().replace(/\.$/, '');
  const exact = BLOCKLIST_BY_DOMAIN.get(normalized);
  if (exact) return exact;

  const labels = normalized.split('.');
  for (let i = 1; i < labels.length - 1; i += 1) {
    const match = BLOCKLIST_BY_DOMAIN.get(labels.slice(i).join('.'));
    if (match) return match;
  }
  return null;
}
