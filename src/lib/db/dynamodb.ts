import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      }
    : undefined,
});

// Create document client with marshalling options
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Table name from environment
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "opencitation";

// Key prefixes for single-table design
export const PREFIXES = {
  USER: "USER#",
  LIST: "LIST#",
  PROJECT: "PROJECT#",
  CITATION: "CITATION#",
  SHARE: "SHARE#",
  PROFILE: "PROFILE",
  META: "META",
} as const;

// Helper to generate keys
export const keys = {
  user: (userId: string) => `${PREFIXES.USER}${userId}`,
  list: (listId: string) => `${PREFIXES.LIST}${listId}`,
  project: (projectId: string) => `${PREFIXES.PROJECT}${projectId}`,
  citation: (citationId: string) => `${PREFIXES.CITATION}${citationId}`,
  share: (shareCode: string) => `${PREFIXES.SHARE}${shareCode}`,
};

// Generate unique IDs
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

// Generate share codes (shorter, URL-safe)
export function generateShareCode(): string {
  return Math.random().toString(36).substring(2, 10);
}
