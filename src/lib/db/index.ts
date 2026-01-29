// Conditional exports based on environment
// If AWS is not configured, use local in-memory store for development

const useLocalStore = !process.env.AWS_ACCESS_KEY_ID || process.env.USE_LOCAL_DB === "true";

// Re-export based on configuration
export * from "./local-store";

// Also export DynamoDB utilities for routes that need them (will be no-ops in local mode)
export { docClient, TABLE_NAME, PREFIXES, keys } from "./dynamodb";

// Export types that are the same regardless of storage
export type { CitationFields, CitationStyle } from "@/types";
