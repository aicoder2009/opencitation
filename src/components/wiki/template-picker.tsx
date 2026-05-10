"use client";

import { useState, useEffect } from "react";
import {
  getTemplates,
  deleteTemplate,
  type CitationTemplate,
} from "@/lib/templates";

interface TemplatePickerProps {
  onSelectTemplate: (template: CitationTemplate) => void;
  /** Increment to force a refresh of the saved-templates list from storage. */
  refreshKey?: number;
}

export function TemplatePicker({
  onSelectTemplate,
  refreshKey,
}: TemplatePickerProps) {
  const [templates, setTemplates] = useState<CitationTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTemplates(getTemplates());
  }, [refreshKey]);

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
    setTemplates(templates.filter((t) => t.id !== id));
  };

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="text-wiki-link hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
        >
          {showTemplates ? "[-] Hide Templates" : "[+] Templates"}
          {templates.length > 0 && (
            <span className="ml-1 text-wiki-text-muted">
              ({templates.length})
            </span>
          )}
        </button>
      </div>

      {showTemplates && (
        <div className="mt-3 border border-wiki-border-light">
          {templates.length === 0 ? (
            <div className="p-3 text-sm text-wiki-text-muted text-center">
              No saved templates yet. Create one to quickly reuse source configurations.
            </div>
          ) : (
            <div className="divide-y divide-wiki-border-light max-h-48 overflow-y-auto">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-2 hover:bg-wiki-offwhite flex items-center justify-between"
                >
                  <button
                    type="button"
                    onClick={() => onSelectTemplate(template)}
                    className="flex-1 text-left text-wiki-link hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                  >
                    <span className="font-medium text-sm">{template.name}</span>
                    <span className="ml-2 text-xs text-wiki-text-muted">
                      ({template.sourceType})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-wiki-link text-xs hover:underline ml-2 focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
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
