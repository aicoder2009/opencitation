/**
 * Citation Templates
 *
 * Allows users to save frequently-used source configurations for quick reuse.
 * Templates are stored in localStorage.
 */

import type { SourceType, AccessType } from "@/types";

export interface CitationTemplate {
  id: string;
  name: string;
  sourceType: SourceType;
  accessType: AccessType;
  fields: {
    siteName?: string;
    journalTitle?: string;
    publisher?: string;
    channelName?: string;
    platform?: string;
  };
  createdAt: string;
}

const TEMPLATES_KEY = "opencitation_templates";
const MAX_TEMPLATES = 20;

/**
 * Get all saved templates
 */
export function getTemplates(): CitationTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save a new template
 */
export function saveTemplate(template: Omit<CitationTemplate, "id" | "createdAt">): CitationTemplate {
  const templates = getTemplates();

  const newTemplate: CitationTemplate = {
    ...template,
    id: `tpl-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  // Add to beginning, limit to max
  const updated = [newTemplate, ...templates].slice(0, MAX_TEMPLATES);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));

  return newTemplate;
}

/**
 * Delete a template
 */
export function deleteTemplate(id: string): void {
  const templates = getTemplates();
  const updated = templates.filter((t) => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(updated));
}

/**
 * Update a template
 */
export function updateTemplate(
  id: string,
  updates: Partial<Omit<CitationTemplate, "id" | "createdAt">>
): CitationTemplate | null {
  const templates = getTemplates();
  const index = templates.findIndex((t) => t.id === id);

  if (index === -1) return null;

  const updated = { ...templates[index], ...updates };
  templates[index] = updated;
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));

  return updated;
}

/**
 * Get suggested template name based on fields
 */
export function suggestTemplateName(
  sourceType: SourceType,
  fields: CitationTemplate["fields"]
): string {
  if (fields.journalTitle) return fields.journalTitle;
  if (fields.siteName) return fields.siteName;
  if (fields.publisher) return fields.publisher;
  if (fields.channelName) return fields.channelName;

  const sourceNames: Record<SourceType, string> = {
    book: "Book Template",
    journal: "Journal Template",
    website: "Website Template",
    blog: "Blog Template",
    newspaper: "Newspaper Template",
    video: "Video Template",
    image: "Image Template",
    film: "Film Template",
    "tv-series": "TV Series Template",
    "tv-episode": "TV Episode Template",
    miscellaneous: "Custom Template",
  };

  return sourceNames[sourceType] || "Custom Template";
}
