"use client";

import { useState, useEffect } from "react";
import {
  getTemplates,
  saveTemplate,
  deleteTemplate,
  suggestTemplateName,
  type CitationTemplate,
} from "@/lib/templates";
import type { SourceType, AccessType } from "@/types";

interface TemplatePickerProps {
  sourceType: SourceType;
  accessType: AccessType;
  currentFields: {
    siteName?: string;
    journalTitle?: string;
    publisher?: string;
    channelName?: string;
    platform?: string;
  };
  onSelectTemplate: (template: CitationTemplate) => void;
}

export function TemplatePicker({
  sourceType,
  accessType,
  currentFields,
  onSelectTemplate,
}: TemplatePickerProps) {
  const [templates, setTemplates] = useState<CitationTemplate[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    setTemplates(getTemplates());
  }, []);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;

    const newTemplate = saveTemplate({
      name: templateName.trim(),
      sourceType,
      accessType,
      fields: currentFields,
    });

    setTemplates([newTemplate, ...templates]);
    setShowSaveForm(false);
    setTemplateName("");
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
    setTemplates(templates.filter((t) => t.id !== id));
  };

  const suggestedName = suggestTemplateName(sourceType, currentFields);

  // Filter templates that match the current source type (optional filter)
  const matchingTemplates = templates;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="text-wiki-link hover:underline"
        >
          {showTemplates ? "[-] Hide Templates" : "[+] Templates"}
          {matchingTemplates.length > 0 && (
            <span className="ml-1 text-wiki-text-muted">
              ({matchingTemplates.length})
            </span>
          )}
        </button>
        <span className="text-wiki-text-muted">|</span>
        <button
          type="button"
          onClick={() => {
            setShowSaveForm(!showSaveForm);
            if (!showSaveForm) {
              setTemplateName(suggestedName);
            }
          }}
          className="text-wiki-link hover:underline"
        >
          {showSaveForm ? "Cancel" : "Save as Template"}
        </button>
      </div>

      {/* Save Template Form */}
      {showSaveForm && (
        <div className="mt-3 p-3 border border-wiki-border-light bg-wiki-offwhite">
          <label className="block text-sm font-medium mb-1">Template Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Nature Journal, My Blog"
              className="flex-1 px-2 py-1 text-sm border border-wiki-border-light"
              onKeyDown={(e) => e.key === "Enter" && handleSaveTemplate()}
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveTemplate}
              disabled={!templateName.trim()}
              className="px-3 py-1 text-sm bg-wiki-link text-white hover:bg-wiki-link-hover disabled:opacity-50"
            >
              Save
            </button>
          </div>
          <p className="mt-1 text-xs text-wiki-text-muted">
            Saves current source type, access type, and common fields (site name, journal, publisher, etc.)
          </p>
        </div>
      )}

      {/* Template List */}
      {showTemplates && (
        <div className="mt-3 border border-wiki-border-light">
          {matchingTemplates.length === 0 ? (
            <div className="p-3 text-sm text-wiki-text-muted text-center">
              No saved templates yet. Create one to quickly reuse source configurations.
            </div>
          ) : (
            <div className="divide-y divide-wiki-border-light max-h-48 overflow-y-auto">
              {matchingTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-2 hover:bg-wiki-offwhite flex items-center justify-between"
                >
                  <button
                    type="button"
                    onClick={() => onSelectTemplate(template)}
                    className="flex-1 text-left"
                  >
                    <span className="font-medium text-sm">{template.name}</span>
                    <span className="ml-2 text-xs text-wiki-text-muted">
                      ({template.sourceType})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 text-xs hover:underline ml-2"
                    title="Delete template"
                  >
                    [delete]
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
