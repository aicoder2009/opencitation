import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkDedicatedBlocklist,
  formatBlockMessage,
  DETAILED_BLOCK_MESSAGE_TEMPLATE,
} from './blocklist';
import { evaluateUrlWithJev } from './jev';

describe('Dedicated Blocklist & Formatting', () => {
  it('correctly matches domains in the dedicated blocklist', () => {
    expect(checkDedicatedBlocklist('chatgpt.com')).not.toBeNull();
    expect(checkDedicatedBlocklist('chat.openai.com')).not.toBeNull();
    expect(checkDedicatedBlocklist('claude.ai')).not.toBeNull();
    expect(checkDedicatedBlocklist('app.perplexity.ai')).not.toBeNull();
    expect(checkDedicatedBlocklist('nature.com')).toBeNull();
    expect(checkDedicatedBlocklist('wikipedia.org')).toBeNull();
  });

  it('interpolates {website url} and {url} variables properly', () => {
    const template = 'Sorry, {website url} is blocked';
    const message = formatBlockMessage(template, {
      url: 'https://chatgpt.com/c/12345',
      host: 'chatgpt.com',
      reason: 'Interactive AI chat interface',
    });

    expect(message).toBe('Sorry, https://chatgpt.com/c/12345 is blocked');
  });

  it('formats detailed messages with host, reason, and confidence', () => {
    const message = formatBlockMessage(DETAILED_BLOCK_MESSAGE_TEMPLATE, {
      url: 'https://custom-bot.ai/chat',
      host: 'custom-bot.ai',
      reason: 'Interactive AI chat application',
      confidence: 0.94,
      source: 'jev',
    });

    expect(message).toBe(
      'Sorry, https://custom-bot.ai/chat (custom-bot.ai) is blocked from lookup (Interactive AI chat application). Evaluated by: jev with 94% confidence.'
    );
  });
});

describe('evaluateUrlWithJev', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('immediately blocks URLs on the dedicated blocklist without calling Jev', async () => {
    const fetchSpy = vi.fn();
    global.fetch = fetchSpy as unknown as typeof fetch;

    const result = await evaluateUrlWithJev('https://chatgpt.com/c/abc', {
      customTemplate: 'Sorry, {website url} is blocked: {reason}',
    });

    expect(result.blocked).toBe(true);
    expect(result.source).toBe('blocklist');
    expect(result.message).toBe(
      'Sorry, https://chatgpt.com/c/abc is blocked: Interactive AI chat interface'
    );
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('calls Jev API when key is provided for an unknown domain', async () => {
    const mockJevResponse = {
      answers: {
        should_block: {
          value: true,
          probability: 0.96,
          confidence: 0.92,
        },
        category: {
          value: 'ai_chat_interface',
          probability: 0.91,
          confidence: 0.95,
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockJevResponse,
    }) as unknown as typeof fetch;

    const result = await evaluateUrlWithJev('https://novel-ai-tool.internal/session', {
      apiKey: 'test-typesafe-key',
      customTemplate: 'Sorry, {website url} is blocked ({reason}). Confidence: {confidence}.',
    });

    expect(result.blocked).toBe(true);
    expect(result.source).toBe('jev');
    expect(result.confidence).toBe(0.92);
    expect(result.message).toBe(
      'Sorry, https://novel-ai-tool.internal/session is blocked (Interactive AI chat application). Confidence: 92%.'
    );
  });

  it('allows safe static pages when Jev indicates should_block is false', async () => {
    const mockJevResponse = {
      answers: {
        should_block: {
          value: false,
          probability: 0.05,
          confidence: 0.98,
        },
        category: {
          value: 'scholarly_resource',
          probability: 0.95,
          confidence: 0.99,
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockJevResponse,
    }) as unknown as typeof fetch;

    const result = await evaluateUrlWithJev('https://arxiv.org/abs/2301.00001', {
      apiKey: 'test-typesafe-key',
    });

    expect(result.blocked).toBe(false);
    expect(result.source).toBe('allowed');
  });
});
