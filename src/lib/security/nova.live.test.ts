import { describe, it, expect } from 'vitest';
import fs from 'fs';
import { evaluateUrlWithNova } from './nova';

// Load .env.local for live test
if (fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  envContent.split('\n').forEach((line) => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
}

describe('Live Amazon Bedrock Nova Micro Moderation', () => {
  it('correctly uses Amazon Nova Micro to identify and block an interactive AI chat interface', async () => {
    const result = await evaluateUrlWithNova('https://my-custom-assistant.ai/chat', {
      customTemplate: 'Sorry, {website url} is blocked ({reason}).',
    });

    console.log('Live Bedrock Result (AI Chat):', result);
    expect(result.blocked).toBe(true);
    expect(result.source).toBe('bedrock_nova');
    expect(result.message).toContain('Sorry, https://my-custom-assistant.ai/chat is blocked');
  }, 10000);

  it('correctly uses Amazon Nova Micro to allow a scholarly article', async () => {
    const result = await evaluateUrlWithNova('https://arxiv.org/abs/2301.00001');

    console.log('Live Bedrock Result (ArXiv Paper):', result);
    expect(result.blocked).toBe(false);
    expect(result.source).toBe('allowed');
  }, 10000);
});
