import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluateUrlWithNova } from './nova';
import { checkDedicatedBlocklist } from './blocklist';

describe('evaluateUrlWithNova', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('immediately blocks URLs on the dedicated blocklist without calling Bedrock', async () => {
    const mockSend = vi.fn();
    const fakeClient = { send: mockSend } as any;

    const result = await evaluateUrlWithNova('https://chatgpt.com/c/12345', {
      client: fakeClient,
      customTemplate: 'Sorry, {website url} is blocked: {reason}',
    });

    expect(result.blocked).toBe(true);
    expect(result.source).toBe('blocklist');
    expect(result.message).toBe('Sorry, https://chatgpt.com/c/12345 is blocked: Interactive AI chat interface');
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('blocks a common chatbot subdomain without calling Bedrock', async () => {
    const mockSend = vi.fn();
    const result = await evaluateUrlWithNova('https://app.deepseek.com/chat', {
      client: { send: mockSend } as any,
    });

    expect(result.blocked).toBe(true);
    expect(result.source).toBe('blocklist');
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('does not block lookalike domains', () => {
    expect(checkDedicatedBlocklist('notchatgpt.com')).toBeNull();
    expect(checkDedicatedBlocklist('deepseek.com.example.org')).toBeNull();
  });

  it('calls Nova Micro via Bedrock ConverseCommand for unknown URLs and blocks if positive', async () => {
    const mockSend = vi.fn().mockResolvedValue({
      output: {
        message: {
          content: [
            {
              text: JSON.stringify({
                should_block: true,
                category: 'ai_chat',
                reason: 'Novel interactive chat application',
              }),
            },
          ],
        },
      },
    });

    const fakeClient = { send: mockSend } as any;

    const result = await evaluateUrlWithNova('https://internal-bot.enterprise.ai/session', {
      client: fakeClient,
      customTemplate: 'Sorry, {website url} is blocked ({reason}).',
    });

    expect(result.blocked).toBe(true);
    expect(result.source).toBe('bedrock_nova');
    expect(result.reason).toBe('Novel interactive chat application');
    expect(result.message).toBe(
      'Sorry, https://internal-bot.enterprise.ai/session is blocked (Novel interactive chat application).'
    );
    expect(mockSend).toHaveBeenCalledTimes(1);
  });

  it('allows safe resources when Nova Micro classifies should_block as false', async () => {
    const mockSend = vi.fn().mockResolvedValue({
      output: {
        message: {
          content: [
            {
              text: JSON.stringify({
                should_block: false,
                category: 'safe',
                reason: 'Public research paper',
              }),
            },
          ],
        },
      },
    });

    const fakeClient = { send: mockSend } as any;

    const result = await evaluateUrlWithNova('https://nature.com/articles/d41586-024-00001-x', {
      client: fakeClient,
    });

    expect(result.blocked).toBe(false);
    expect(result.source).toBe('allowed');
  });

  it('fails open gracefully if Bedrock throws an error or times out', async () => {
    const mockSend = vi.fn().mockRejectedValue(new Error('Bedrock timeout / connection failure'));
    const fakeClient = { send: mockSend } as any;

    const result = await evaluateUrlWithNova('https://unknown-domain.com/article', {
      client: fakeClient,
    });

    expect(result.blocked).toBe(false);
    expect(result.source).toBe('allowed');
  });
});
