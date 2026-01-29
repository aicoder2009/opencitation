// Conditional exports based on environment
// If AWS is not configured, use local in-memory store for development

import * as localStore from "./local-store";
import * as dynamoDB from "./dynamodb";

const useLocalStore = !process.env.AWS_ACCESS_KEY_ID || process.env.USE_LOCAL_DB === "true";

// Select the appropriate implementation
const db = useLocalStore ? localStore : dynamoDB;

// ============ LISTS ============
export const createList = db.createList;
export const getList = db.getList;
export const getUserLists = db.getUserLists;
export const updateList = db.updateList;
export const deleteList = db.deleteList;

// ============ PROJECTS ============
export const createProject = db.createProject;
export const getProject = db.getProject;
export const getUserProjects = db.getUserProjects;
export const updateProject = db.updateProject;
export const deleteProject = db.deleteProject;
export const getProjectLists = db.getProjectLists;

// ============ CITATIONS ============
export const addCitation = db.addCitation;
export const getCitation = db.getCitation;
export const getListCitations = db.getListCitations;
export const updateCitation = db.updateCitation;
export const deleteCitation = db.deleteCitation;

// ============ SHARE LINKS ============
export const createShareLink = db.createShareLink;
export const getShareLink = db.getShareLink;
export const deleteShareLink = db.deleteShareLink;

// ============ HELPERS ============
export const findListById = db.findListById;
export const findProjectById = db.findProjectById;

// ============ TYPES ============
export type { List, Project, Citation, ShareLink } from "./local-store";

// Export DynamoDB utilities for advanced use cases
export { docClient, TABLE_NAME, PREFIXES, keys } from "./dynamodb";

// Export types from @/types for convenience
export type { CitationFields, CitationStyle } from "@/types";
