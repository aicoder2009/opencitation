/**
 * Amazon Bedrock - Amazon Nova Micro URL Moderation Integration
 *
 * Uses Amazon Nova Micro (us.amazon.nova-micro-v1:0) via AWS Bedrock Runtime.
 * Performs fast, structured binary moderation decisions on user-submitted URLs
 * without free-form hallucination.
 *
 * Supports AWS credentials via:
 * 1. IAM / STS temporary session tokens (automatic rotation / refresh)
 * 2. AWS SSO / Default profile or explicit AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_SESSION_TOKEN
 */

import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import {
  checkDedicatedBlocklist,
  formatBlockMessage,
  DEFAULT_BLOCK_MESSAGE_TEMPLATE,
  BlockMessageContext,
} from './blocklist';

export interface NovaDecisionResult {
  blocked: boolean;
  message?: string;
  category?: string;
  reason?: string;
  source: 'blocklist' | 'bedrock_nova' | 'allowed';
}

const NOVA_MODEL_ID = process.env.BEDROCK_NOVA_MODEL_ID || 'amazon.nova-micro-v1:0';
const AWS_BEDROCK_REGION = process.env.AWS_BEDROCK_REGION || process.env.AWS_REGION || 'us-east-1';

let bedrockClient: BedrockRuntimeClient | null = null;

function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    const hasExplicitKeys = Boolean(
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    );

    const credentials = hasExplicitKeys
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          sessionToken: process.env.AWS_SESSION_TOKEN,
        }
      : undefined;

    // If explicit keys aren't provided, AWS SDK v3 automatically resolves
    // credentials from the AWS SSO profile (defaulting to 'aigenius' if unset)
    // and automatically refreshes expiring tokens without manual intervention.
    if (!credentials && !process.env.AWS_PROFILE) {
      process.env.AWS_PROFILE = 'aigenius';
    }

    bedrockClient = new BedrockRuntimeClient({
      region: AWS_BEDROCK_REGION,
      credentials,
    });
  }
  return bedrockClient;
}

/**
 * Moderates a URL using:
 * 1. Dedicated blocklist (local, instant)
 * 2. Amazon Nova Micro via AWS Bedrock (if AWS credentials configured)
 * 3. Graceful fallback allowing the request if Bedrock is not configured or fails
 */
export async function evaluateUrlWithNova(
  targetUrl: string,
  options: {
    customTemplate?: string;
    timeoutMs?: number;
    client?: BedrockRuntimeClient;
  } = {}
): Promise<NovaDecisionResult> {
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

  // 2. Check if AWS credentials or Bedrock are configured
  const hasAwsConfig =
    Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) ||
    Boolean(process.env.AWS_PROFILE) ||
    Boolean(process.env.ENABLE_BEDROCK_MODERATION === 'true');

  if (!hasAwsConfig && !options.client) {
    return {
      blocked: false,
      source: 'allowed',
    };
  }

  try {
    const client = options.client || getBedrockClient();

    const systemPrompt = `You are an automated URL safety classifier for an academic citation service.
Your job is to determine whether a submitted URL is an interactive AI chat interface (e.g. ChatGPT, Claude, Gemini, Perplexity), an interactive single-page app without static document content, or a restricted service that cannot be cited as a reference.
Respond ONLY with a valid JSON object matching this schema:
{"should_block": boolean, "category": "ai_chat" | "interactive_spa" | "restricted" | "safe", "reason": string}`;

    const userMessage = `URL: ${targetUrl}
Host: ${host}
Analyze if this URL should be blocked.`;

    const command = new ConverseCommand({
      modelId: NOVA_MODEL_ID,
      system: [{ text: systemPrompt }],
      messages: [
        {
          role: 'user',
          content: [{ text: userMessage }],
        },
      ],
      inferenceConfig: {
        maxTokens: 150,
        temperature: 0,
      },
    });

    const response = await client.send(command, {
      abortSignal: AbortSignal.timeout(options.timeoutMs || 3000),
    });

    const outputText = response.output?.message?.content?.[0]?.text;
    if (!outputText) {
      return { blocked: false, source: 'allowed' };
    }

    // Parse JSON response safely
    const cleanJson = outputText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanJson);

    if (parsed.should_block === true) {
      const reason = parsed.reason || 'Restricted interactive service';
      const ctx: BlockMessageContext = {
        url: targetUrl,
        host,
        reason,
        category: parsed.category || 'restricted',
        source: 'bedrock_nova',
      };

      return {
        blocked: true,
        category: parsed.category,
        reason,
        source: 'bedrock_nova',
        message: formatBlockMessage(options.customTemplate || DEFAULT_BLOCK_MESSAGE_TEMPLATE, ctx),
      };
    }

    return {
      blocked: false,
      source: 'allowed',
    };
  } catch (err) {
    // Fail-open gracefully on Bedrock errors/timeouts so citation lookup isn't broken
    console.warn('Amazon Nova Bedrock moderation check skipped/failed:', (err as Error).message);
    return {
      blocked: false,
      source: 'allowed',
    };
  }
}
