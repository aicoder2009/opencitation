// Local in-memory store for development (no AWS required)
// This is a simple mock that stores data in memory
// Data persists only for the lifetime of the server process

import type { CitationFields, CitationStyle } from "@/types";

// In-memory data store
const store: {
  lists: Map<string, List>;
  projects: Map<string, Project>;
  citations: Map<string, Citation>;
  shareLinks: Map<string, ShareLink>;
  stats: { citationsGenerated: number };
} = {
  lists: new Map(),
  projects: new Map(),
  citations: new Map(),
  shareLinks: new Map(),
  stats: { citationsGenerated: 0 },
};

// Export types for compatibility with queries.ts
export interface List {
  id: string;
  userId: string;
  name: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  id: string;
  listId: string;
  fields: CitationFields;
  style: CitationStyle;
  formattedText: string;
  formattedHtml: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ShareLink {
  code: string;
  type: "list" | "project";
  targetId: string;
  createdAt: string;
  expiresAt?: string;
}

// Generate unique IDs
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

function generateShareCode(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ============ LISTS ============

export async function createList(userId: string, name: string, projectId?: string): Promise<List> {
  const id = generateId();
  const now = new Date().toISOString();
  const list: List = { id, userId, name, projectId, createdAt: now, updatedAt: now };
  store.lists.set(`${userId}:${id}`, list);
  return list;
}

export async function getList(userId: string, listId: string): Promise<List | null> {
  return store.lists.get(`${userId}:${listId}`) || null;
}

export async function getUserLists(userId: string): Promise<List[]> {
  const lists: List[] = [];
  store.lists.forEach((list, key) => {
    if (key.startsWith(`${userId}:`)) {
      lists.push(list);
    }
  });
  return lists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateList(
  userId: string,
  listId: string,
  updates: { name?: string; projectId?: string | null }
): Promise<List | null> {
  const key = `${userId}:${listId}`;
  const list = store.lists.get(key);
  if (!list) return null;

  const updated = {
    ...list,
    ...updates,
    projectId: updates.projectId === null ? undefined : (updates.projectId ?? list.projectId),
    updatedAt: new Date().toISOString(),
  };
  store.lists.set(key, updated);
  return updated;
}

export async function deleteList(userId: string, listId: string): Promise<void> {
  // Delete all citations in the list
  store.citations.forEach((citation, key) => {
    if (citation.listId === listId) {
      store.citations.delete(key);
    }
  });
  store.lists.delete(`${userId}:${listId}`);
}

// ============ PROJECTS ============

export async function createProject(userId: string, name: string, description?: string): Promise<Project> {
  const id = generateId();
  const now = new Date().toISOString();
  const project: Project = { id, userId, name, description, createdAt: now, updatedAt: now };
  store.projects.set(`${userId}:${id}`, project);
  return project;
}

export async function getProject(userId: string, projectId: string): Promise<Project | null> {
  return store.projects.get(`${userId}:${projectId}`) || null;
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const projects: Project[] = [];
  store.projects.forEach((project, key) => {
    if (key.startsWith(`${userId}:`)) {
      projects.push(project);
    }
  });
  return projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateProject(
  userId: string,
  projectId: string,
  updates: { name?: string; description?: string }
): Promise<Project | null> {
  const key = `${userId}:${projectId}`;
  const project = store.projects.get(key);
  if (!project) return null;

  const updated = { ...project, ...updates, updatedAt: new Date().toISOString() };
  store.projects.set(key, updated);
  return updated;
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  // Remove project association from lists
  store.lists.forEach((list, key) => {
    if (list.projectId === projectId && list.userId === userId) {
      store.lists.set(key, { ...list, projectId: undefined, updatedAt: new Date().toISOString() });
    }
  });
  store.projects.delete(`${userId}:${projectId}`);
}

export async function getProjectLists(userId: string, projectId: string): Promise<List[]> {
  const lists: List[] = [];
  store.lists.forEach((list) => {
    if (list.userId === userId && list.projectId === projectId) {
      lists.push(list);
    }
  });
  return lists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ============ CITATIONS ============

export async function addCitation(
  listId: string,
  fields: CitationFields,
  style: CitationStyle,
  formattedText: string,
  formattedHtml: string,
  tags?: string[]
): Promise<Citation> {
  const id = generateId();
  const now = new Date().toISOString();
  const citation: Citation = { id, listId, fields, style, formattedText, formattedHtml, tags, createdAt: now, updatedAt: now };
  store.citations.set(`${listId}:${id}`, citation);
  return citation;
}

export async function getCitation(listId: string, citationId: string): Promise<Citation | null> {
  return store.citations.get(`${listId}:${citationId}`) || null;
}

export async function getListCitations(listId: string): Promise<Citation[]> {
  const citations: Citation[] = [];
  store.citations.forEach((citation, key) => {
    if (key.startsWith(`${listId}:`)) {
      citations.push(citation);
    }
  });
  return citations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateCitation(
  listId: string,
  citationId: string,
  updates: { fields?: CitationFields; style?: CitationStyle; formattedText?: string; formattedHtml?: string; tags?: string[] }
): Promise<Citation | null> {
  const key = `${listId}:${citationId}`;
  const citation = store.citations.get(key);
  if (!citation) return null;

  const updated = { ...citation, ...updates, updatedAt: new Date().toISOString() };
  store.citations.set(key, updated);
  return updated;
}

export async function deleteCitation(listId: string, citationId: string): Promise<void> {
  store.citations.delete(`${listId}:${citationId}`);
}

// ============ SHARE LINKS ============

export async function createShareLink(
  type: "list" | "project",
  targetId: string,
  expiresInDays?: number
): Promise<ShareLink> {
  const code = generateShareCode();
  const now = new Date();
  const expiresAt = expiresInDays
    ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined;
  const shareLink: ShareLink = { code, type, targetId, createdAt: now.toISOString(), expiresAt };
  store.shareLinks.set(code, shareLink);
  return shareLink;
}

export async function getShareLink(code: string): Promise<ShareLink | null> {
  const shareLink = store.shareLinks.get(code);
  if (!shareLink) return null;
  if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) return null;
  return shareLink;
}

export async function deleteShareLink(code: string): Promise<void> {
  store.shareLinks.delete(code);
}

// Helper to find list by ID (for share functionality)
export async function findListById(listId: string): Promise<List | null> {
  let found: List | null = null;
  store.lists.forEach((list) => {
    if (list.id === listId) found = list;
  });
  return found;
}

// Helper to find project by ID (for share functionality)
export async function findProjectById(projectId: string): Promise<Project | null> {
  let found: Project | null = null;
  store.projects.forEach((project) => {
    if (project.id === projectId) found = project;
  });
  return found;
}

// ============ STATS ============

export async function getStats(): Promise<{ citationsGenerated: number }> {
  return { citationsGenerated: store.stats.citationsGenerated };
}

export async function incrementCitationCount(): Promise<void> {
  store.stats.citationsGenerated += 1;
}
