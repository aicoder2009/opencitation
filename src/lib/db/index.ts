// Conditional exports based on environment
// If AWS is not configured, use local in-memory store for development

import * as localStore from "./local-store";
import * as dynamoDB from "./dynamodb";

const useLocalStore = !process.env.AWS_ACCESS_KEY_ID || process.env.USE_LOCAL_DB === "true";

// Select the appropriate implementation
const db = useLocalStore ? localStore : dynamoDB;

// ============ LISTS ============
export const {createList} = db;
export const {getList} = db;
export const {getUserLists} = db;
export const {updateList} = db;
export const {deleteList} = db;

// ============ PROJECTS ============
export const {createProject} = db;
export const {getProject} = db;
export const {getUserProjects} = db;
export const {updateProject} = db;
export const {deleteProject} = db;
export const {getProjectLists} = db;

// ============ CITATIONS ============
export const {addCitation} = db;
export const {getCitation} = db;
export const {getListCitations} = db;
export const {updateCitation} = db;
export const {deleteCitation} = db;
export const {reorderCitations} = db;

// ============ SHARE LINKS ============
export const {createShareLink} = db;
export const {getShareLink} = db;
export const {deleteShareLink} = db;
export const {listUserShares} = db;
export const {deleteSharesForTarget} = db;

// ============ HELPERS ============
export const {findListById} = db;
export const {findProjectById} = db;

// ============ STATS ============
export const {getStats} = db;
export const {incrementCitationCount} = db;

// ============ TYPES ============
export type { List, Project, Citation, ShareLink } from "./local-store";

// Export DynamoDB utilities for advanced use cases
export { docClient, TABLE_NAME, PREFIXES, keys } from "./dynamodb";

// Export types from @/types for convenience
export type { CitationFields, CitationStyle } from "@/types";
