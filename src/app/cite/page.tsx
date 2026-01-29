"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiTabs } from "@/components/wiki/wiki-tabs";
import { WikiCollapsible } from "@/components/wiki/wiki-collapsible";
import { WikiButton } from "@/components/wiki/wiki-button";
import { formatCitation } from "@/lib/citation";
import type { CitationStyle, SourceType, AccessType, CitationFields } from "@/types";

interface List {
  id: string;
  name: string;
}

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: "book", label: "Book" },
  { value: "journal", label: "Journal" },
  { value: "website", label: "Website" },
  { value: "blog", label: "Blog" },
  { value: "newspaper", label: "Newspaper" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
  { value: "film", label: "Film" },
  { value: "tv-series", label: "TV Series" },
  { value: "tv-episode", label: "TV Episode" },
  { value: "miscellaneous", label: "Miscellaneous" },
];

const CITATION_STYLES: { value: CitationStyle; label: string }[] = [
  { value: "apa", label: "APA 7th" },
  { value: "mla", label: "MLA 9th" },
  { value: "chicago", label: "Chicago 17th" },
  { value: "harvard", label: "Harvard" },
];

const ACCESS_TYPES: { value: AccessType; label: string }[] = [
  { value: "web", label: "Web" },
  { value: "print", label: "Print" },
  { value: "database", label: "Database" },
  { value: "app", label: "App" },
  { value: "archive", label: "Archive" },
];

interface FormData {
  authorFirst: string;
  authorLast: string;
  title: string;
  subtitle: string;
  year: string;
  month: string;
  day: string;
  publisher: string;
  url: string;
  doi: string;
  // Journal specific
  journalTitle: string;
  volume: string;
  issue: string;
  pages: string;
  // Website/Blog specific
  siteName: string;
  // Video specific
  channelName: string;
  platform: string;
}

const initialFormData: FormData = {
  authorFirst: "",
  authorLast: "",
  title: "",
  subtitle: "",
  year: "",
  month: "",
  day: "",
  publisher: "",
  url: "",
  doi: "",
  journalTitle: "",
  volume: "",
  issue: "",
  pages: "",
  siteName: "",
  channelName: "",
  platform: "",
};

function CitePageContent() {
  const searchParams = useSearchParams();
  const { isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState("quick-add");
  const [selectedStyle, setSelectedStyle] = useState<CitationStyle>("apa");
  const [selectedSourceType, setSelectedSourceType] = useState<SourceType>("website");
  const [selectedAccessType, setSelectedAccessType] = useState<AccessType>("web");
  const [quickAddInput, setQuickAddInput] = useState("");
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [generatedCitation, setGeneratedCitation] = useState<{ text: string; html: string } | null>(null);
  const [citationFields, setCitationFields] = useState<CitationFields | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add to List state
  const [showListModal, setShowListModal] = useState(false);
  const [lists, setLists] = useState<List[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [isAddingToList, setIsAddingToList] = useState(false);
  const [addToListSuccess, setAddToListSuccess] = useState<string | null>(null);

  // Handle URL query parameters
  useEffect(() => {
    const inputParam = searchParams.get("input");
    const tabParam = searchParams.get("tab");
    const sourceParam = searchParams.get("source");

    if (inputParam) {
      setQuickAddInput(inputParam);
      setActiveTab("quick-add");
    }

    if (tabParam === "manual") {
      setActiveTab("manual");
    }

    if (sourceParam && SOURCE_TYPES.some(s => s.value === sourceParam)) {
      setSelectedSourceType(sourceParam as SourceType);
    }
  }, [searchParams]);

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleQuickAdd = async () => {
    if (!quickAddInput.trim()) {
      setError("Please enter a URL, DOI, or ISBN");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const input = quickAddInput.trim();
      let apiEndpoint: string;
      let body: object;

      // Detect input type
      if (input.match(/^(https?:\/\/|www\.)/i)) {
        apiEndpoint = "/api/lookup/url";
        body = { url: input };
      } else if (input.match(/^10\.\d{4,}/)) {
        apiEndpoint = "/api/lookup/doi";
        body = { doi: input };
      } else if (input.match(/^(97[89])?\d{9}[\dX]$/i) || input.match(/^\d{1,5}-\d{1,7}-\d{1,7}-[\dX]$/i)) {
        apiEndpoint = "/api/lookup/isbn";
        body = { isbn: input.replace(/[-\s]/g, "") };
      } else {
        setError("Could not detect input type. Please enter a valid URL, DOI, or ISBN.");
        setIsLoading(false);
        return;
      }

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "Failed to fetch citation data");
        setIsLoading(false);
        return;
      }

      // Map API response to form data and generate citation
      const {data} = result;
      const fields = buildCitationFields(data, selectedSourceType, selectedAccessType);
      const formatted = formatCitation(fields, selectedStyle);
      setCitationFields(fields);
      setGeneratedCitation(formatted);
      setAddToListSuccess(null);
    } catch (err) {
      setError("Failed to fetch citation data. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualGenerate = () => {
    setError(null);

    if (!formData.title.trim()) {
      setError("Title is required");
      return;
    }

    const fields = buildCitationFieldsFromForm();
    const formatted = formatCitation(fields, selectedStyle);
    setCitationFields(fields);
    setGeneratedCitation(formatted);
    setAddToListSuccess(null);
  };

  const buildCitationFields = (data: Record<string, unknown>, sourceType: SourceType, accessType: AccessType): CitationFields => {
    // Build citation fields from API response
    const baseFields = {
      sourceType,
      accessType,
      title: (data.title as string) || "Untitled",
      subtitle: data.subtitle as string | undefined,
      url: data.url as string | undefined,
      doi: data.doi as string | undefined,
      publisher: data.publisher as string | undefined,
    };

    // Parse authors if available
    const authors = [];
    if (data.authors && Array.isArray(data.authors)) {
      for (const author of data.authors) {
        if (typeof author === "object" && author !== null) {
          authors.push({
            firstName: (author as { firstName?: string }).firstName,
            lastName: (author as { lastName?: string }).lastName || "Unknown",
          });
        }
      }
    } else if (data.author && typeof data.author === "string") {
      const parts = (data.author as string).split(" ");
      authors.push({
        firstName: parts.slice(0, -1).join(" "),
        lastName: parts[parts.length - 1] || data.author as string,
      });
    }

    if (authors.length > 0) {
      (baseFields as Record<string, unknown>).authors = authors;
    }

    // Parse date
    if (data.publicationDate && typeof data.publicationDate === "object") {
      (baseFields as Record<string, unknown>).publicationDate = data.publicationDate;
    } else if (data.publishedDate && typeof data.publishedDate === "string") {
      const match = (data.publishedDate as string).match(/(\d{4})/);
      if (match) {
        (baseFields as Record<string, unknown>).publicationDate = { year: parseInt(match[1]) };
      }
    }

    // Add source-type specific fields
    switch (sourceType) {
      case "journal":
        return {
          ...baseFields,
          sourceType: "journal" as const,
          journalTitle: (data.journalTitle as string) || "Unknown Journal",
          volume: data.volume as string | undefined,
          issue: data.issue as string | undefined,
          pageRange: data.pageRange as string | undefined,
        };
      case "website":
        return {
          ...baseFields,
          sourceType: "website" as const,
          siteName: (data.siteName as string) || undefined,
        };
      case "book":
        return {
          ...baseFields,
          sourceType: "book" as const,
          isbn: data.isbn as string | undefined,
          edition: data.edition as string | undefined,
        };
      default:
        return {
          ...baseFields,
          sourceType: "miscellaneous" as const,
        };
    }
  };

  const buildCitationFieldsFromForm = (): CitationFields => {
    const baseFields = {
      sourceType: selectedSourceType,
      accessType: selectedAccessType,
      title: formData.title,
      subtitle: formData.subtitle || undefined,
      url: formData.url || undefined,
      doi: formData.doi || undefined,
      publisher: formData.publisher || undefined,
      authors: formData.authorLast
        ? [{ firstName: formData.authorFirst || undefined, lastName: formData.authorLast }]
        : undefined,
      publicationDate: formData.year
        ? {
            year: parseInt(formData.year),
            month: formData.month ? parseInt(formData.month) : undefined,
            day: formData.day ? parseInt(formData.day) : undefined,
          }
        : undefined,
    };

    // Add source-type specific fields
    switch (selectedSourceType) {
      case "journal":
        return {
          ...baseFields,
          sourceType: "journal" as const,
          journalTitle: formData.journalTitle || "Unknown Journal",
          volume: formData.volume || undefined,
          issue: formData.issue || undefined,
          pageRange: formData.pages || undefined,
        };
      case "website":
        return {
          ...baseFields,
          sourceType: "website" as const,
          siteName: formData.siteName || undefined,
        };
      case "blog":
        return {
          ...baseFields,
          sourceType: "blog" as const,
          blogName: formData.siteName || "Unknown Blog",
        };
      case "newspaper":
        return {
          ...baseFields,
          sourceType: "newspaper" as const,
          newspaperTitle: formData.siteName || "Unknown Newspaper",
        };
      case "video":
        return {
          ...baseFields,
          sourceType: "video" as const,
          channelName: formData.channelName || undefined,
          platform: formData.platform || undefined,
        };
      case "book":
        return {
          ...baseFields,
          sourceType: "book" as const,
        };
      default:
        return {
          ...baseFields,
          sourceType: "miscellaneous" as const,
        };
    }
  };

  const copyToClipboard = () => {
    if (generatedCitation) {
      navigator.clipboard.writeText(generatedCitation.text);
    }
  };

  const exportCitation = () => {
    if (generatedCitation) {
      const blob = new Blob([generatedCitation.text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `citation-${selectedStyle}-${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const openAddToListModal = async () => {
    if (!isSignedIn) {
      window.location.href = "/sign-in?redirect_url=/cite";
      return;
    }

    setShowListModal(true);
    setIsLoadingLists(true);

    try {
      const response = await fetch("/api/lists");
      const result = await response.json();
      if (result.success) {
        setLists(result.data);
      }
    } catch (err) {
      console.error("Error fetching lists:", err);
    } finally {
      setIsLoadingLists(false);
    }
  };

  const addCitationToList = async (listId: string) => {
    if (!generatedCitation || !citationFields) return;

    setIsAddingToList(true);

    try {
      const response = await fetch(`/api/lists/${listId}/citations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: citationFields,
          style: selectedStyle,
          formattedText: generatedCitation.text,
          formattedHtml: generatedCitation.html,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const listName = lists.find((l) => l.id === listId)?.name || "list";
        setAddToListSuccess(`Added to "${listName}"!`);
        setShowListModal(false);
      } else {
        setError(result.error || "Failed to add citation");
      }
    } catch (err) {
      console.error("Error adding citation:", err);
      setError("Failed to add citation");
    } finally {
      setIsAddingToList(false);
    }
  };

  const getStyleLabel = (value: CitationStyle) =>
    CITATION_STYLES.find(s => s.value === value)?.label || value;

  const getSourceLabel = (value: SourceType) =>
    SOURCE_TYPES.find(s => s.value === value)?.label || value;

  const _getAccessLabel = (value: AccessType) =>
    ACCESS_TYPES.find(s => s.value === value)?.label || value;

  // Render fields based on source type
  const renderSourceFields = () => {
    const commonFields = (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Author First Name</label>
            <input
              type="text"
              value={formData.authorFirst}
              onChange={(e) => updateFormData("authorFirst", e.target.value)}
              placeholder="John"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Author Last Name</label>
            <input
              type="text"
              value={formData.authorLast}
              onChange={(e) => updateFormData("authorLast", e.target.value)}
              placeholder="Smith"
              className="w-full"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => updateFormData("title", e.target.value)}
            placeholder="Title of work"
            className="w-full"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subtitle</label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => updateFormData("subtitle", e.target.value)}
            placeholder="Subtitle (optional)"
            className="w-full"
          />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <input
              type="text"
              value={formData.year}
              onChange={(e) => updateFormData("year", e.target.value)}
              placeholder="2024"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Month</label>
            <input
              type="text"
              value={formData.month}
              onChange={(e) => updateFormData("month", e.target.value)}
              placeholder="1-12"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Day</label>
            <input
              type="text"
              value={formData.day}
              onChange={(e) => updateFormData("day", e.target.value)}
              placeholder="1-31"
              className="w-full"
            />
          </div>
        </div>
      </>
    );

    switch (selectedSourceType) {
      case "book":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-sm font-medium mb-1">Publisher</label>
              <input
                type="text"
                value={formData.publisher}
                onChange={(e) => updateFormData("publisher", e.target.value)}
                placeholder="Publisher name"
                className="w-full"
              />
            </div>
            {selectedAccessType === "web" && (
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => updateFormData("url", e.target.value)}
                  placeholder="https://example.com"
                  className="w-full"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">DOI</label>
              <input
                type="text"
                value={formData.doi}
                onChange={(e) => updateFormData("doi", e.target.value)}
                placeholder="10.1000/xyz123"
                className="w-full"
              />
            </div>
          </>
        );

      case "journal":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-sm font-medium mb-1">Journal Title</label>
              <input
                type="text"
                value={formData.journalTitle}
                onChange={(e) => updateFormData("journalTitle", e.target.value)}
                placeholder="Journal of Example Studies"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Volume</label>
                <input
                  type="text"
                  value={formData.volume}
                  onChange={(e) => updateFormData("volume", e.target.value)}
                  placeholder="12"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issue</label>
                <input
                  type="text"
                  value={formData.issue}
                  onChange={(e) => updateFormData("issue", e.target.value)}
                  placeholder="3"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pages</label>
                <input
                  type="text"
                  value={formData.pages}
                  onChange={(e) => updateFormData("pages", e.target.value)}
                  placeholder="123-145"
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">DOI</label>
              <input
                type="text"
                value={formData.doi}
                onChange={(e) => updateFormData("doi", e.target.value)}
                placeholder="10.1000/xyz123"
                className="w-full"
              />
            </div>
          </>
        );

      case "website":
      case "blog":
      case "newspaper":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-sm font-medium mb-1">
                {selectedSourceType === "website" ? "Site Name" :
                 selectedSourceType === "blog" ? "Blog Name" : "Newspaper Title"}
              </label>
              <input
                type="text"
                value={formData.siteName}
                onChange={(e) => updateFormData("siteName", e.target.value)}
                placeholder={selectedSourceType === "website" ? "Example.com" :
                            selectedSourceType === "blog" ? "The Example Blog" : "The Example Times"}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => updateFormData("url", e.target.value)}
                placeholder="https://example.com/article"
                className="w-full"
              />
            </div>
          </>
        );

      case "video":
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-sm font-medium mb-1">Channel Name</label>
              <input
                type="text"
                value={formData.channelName}
                onChange={(e) => updateFormData("channelName", e.target.value)}
                placeholder="Example Channel"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Platform</label>
              <input
                type="text"
                value={formData.platform}
                onChange={(e) => updateFormData("platform", e.target.value)}
                placeholder="YouTube, Vimeo, etc."
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => updateFormData("url", e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full"
              />
            </div>
          </>
        );

      default:
        return (
          <>
            {commonFields}
            <div>
              <label className="block text-sm font-medium mb-1">Publisher / Source</label>
              <input
                type="text"
                value={formData.publisher}
                onChange={(e) => updateFormData("publisher", e.target.value)}
                placeholder="Publisher or source name"
                className="w-full"
              />
            </div>
            {selectedAccessType === "web" && (
              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => updateFormData("url", e.target.value)}
                  placeholder="https://example.com"
                  className="w-full"
                />
              </div>
            )}
          </>
        );
    }
  };

  return (
    <WikiLayout>
      <WikiBreadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cite" },
        ]}
      />

      <div className="mt-6">
        <h1 className="text-2xl font-bold mb-1">Create Citation</h1>
        <p className="text-wiki-text-muted text-sm mb-6">
          Generate properly formatted citations from URLs, DOIs, ISBNs, or manual entry
        </p>

        {/* Citation Style Selector */}
        <div className="mb-6 p-4 bg-wiki-offwhite border border-wiki-border-light">
          <label className="block text-sm font-medium mb-2">Citation Style</label>
          <div className="flex flex-wrap gap-2">
            {CITATION_STYLES.map((style) => (
              <WikiButton
                key={style.value}
                variant={selectedStyle === style.value ? "primary" : "default"}
                onClick={() => setSelectedStyle(style.value)}
                className={selectedStyle === style.value ? "border-wiki-link" : ""}
              >
                {style.label}
              </WikiButton>
            ))}
          </div>
        </div>

        <WikiTabs
          tabs={[
            { id: "quick-add", label: "Quick Add", active: activeTab === "quick-add" },
            { id: "manual", label: "Manual Entry", active: activeTab === "manual" },
          ]}
          onTabChange={setActiveTab}
        />

        <div className="border border-wiki-border-light border-t-0 bg-wiki-white p-6 md:p-8">
          {activeTab === "quick-add" && (
            <div>
              <h2 className="text-lg font-bold mb-4">Quick Add</h2>
              <p className="mb-4 text-sm text-wiki-text-muted">
                Enter a URL, DOI, or ISBN to automatically extract citation information.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    URL, DOI, or ISBN
                  </label>
                  <input
                    type="text"
                    value={quickAddInput}
                    onChange={(e) => setQuickAddInput(e.target.value)}
                    placeholder="https://example.com/article or 10.1000/xyz123 or 978-3-16-148410-0"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Source Type
                  </label>
                  <select
                    value={selectedSourceType}
                    onChange={(e) => setSelectedSourceType(e.target.value as SourceType)}
                    className="w-full max-w-xs"
                  >
                    {SOURCE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <WikiButton
                  variant="primary"
                  onClick={handleQuickAdd}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Generate Citation"}
                </WikiButton>
              </div>
            </div>
          )}

          {activeTab === "manual" && (
            <div>
              <h2 className="text-lg font-bold mb-4">Manual Entry</h2>
              <p className="mb-4 text-sm text-wiki-text-muted">
                Select a source type and enter the citation details manually.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Source Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {SOURCE_TYPES.slice(0, 6).map((type) => (
                      <WikiButton
                        key={type.value}
                        variant={selectedSourceType === type.value ? "primary" : "default"}
                        onClick={() => {
                          setSelectedSourceType(type.value);
                          setFormData(initialFormData);
                        }}
                        className={selectedSourceType === type.value ? "border-wiki-link" : ""}
                      >
                        {type.label}
                      </WikiButton>
                    ))}
                    <details className="relative inline-block">
                      <summary className="cursor-pointer">
                        <WikiButton
                          variant={SOURCE_TYPES.slice(6).some(t => t.value === selectedSourceType) ? "primary" : "default"}
                        >
                          More...
                        </WikiButton>
                      </summary>
                      <div className="absolute z-10 mt-1 bg-white border border-wiki-border-light shadow-lg p-2 flex flex-col gap-1">
                        {SOURCE_TYPES.slice(6).map((type) => (
                          <WikiButton
                            key={type.value}
                            variant={selectedSourceType === type.value ? "primary" : "default"}
                            onClick={() => {
                              setSelectedSourceType(type.value);
                              setFormData(initialFormData);
                            }}
                            className="w-full text-left"
                          >
                            {type.label}
                          </WikiButton>
                        ))}
                      </div>
                    </details>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Access Type
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {ACCESS_TYPES.map((type) => (
                      <WikiButton
                        key={type.value}
                        variant={selectedAccessType === type.value ? "primary" : "default"}
                        onClick={() => setSelectedAccessType(type.value)}
                        className={selectedAccessType === type.value ? "border-wiki-link" : ""}
                      >
                        {type.label}
                      </WikiButton>
                    ))}
                  </div>
                </div>

                <WikiCollapsible
                  title={`${getSourceLabel(selectedSourceType)} Fields`}
                  defaultOpen
                >
                  <div className="space-y-4">
                    {renderSourceFields()}
                  </div>
                </WikiCollapsible>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <WikiButton variant="primary" onClick={handleManualGenerate}>
                  Generate Citation
                </WikiButton>
              </div>
            </div>
          )}

          {/* Generated Citation Preview */}
          {generatedCitation && (
            <div className="mt-8 pt-6 border-t border-wiki-border-light">
              <h3 className="text-lg font-bold mb-4">Generated Citation ({getStyleLabel(selectedStyle)})</h3>
              <div className="p-4 bg-wiki-offwhite border border-wiki-border-light">
                <p
                  className="citation-text"
                  dangerouslySetInnerHTML={{ __html: generatedCitation.html }}
                />
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <WikiButton
                  variant="primary"
                  onClick={copyToClipboard}
                >
                  Copy to Clipboard
                </WikiButton>
                <WikiButton onClick={openAddToListModal}>
                  Add to List
                </WikiButton>
                <WikiButton onClick={exportCitation}>
                  Export .txt
                </WikiButton>
              </div>
              {addToListSuccess && (
                <div className="mt-3 p-2 bg-green-50 border border-green-200 text-green-700 text-sm">
                  {addToListSuccess}
                </div>
              )}
            </div>
          )}

          {/* Add to List Modal */}
          {showListModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white border border-wiki-border-light max-w-md w-full mx-4 shadow-lg">
                <div className="p-4 border-b border-wiki-border-light flex justify-between items-center">
                  <h3 className="font-bold">Add to List</h3>
                  <button
                    onClick={() => setShowListModal(false)}
                    className="text-wiki-text-muted hover:text-wiki-text"
                  >
                    [close]
                  </button>
                </div>
                <div className="p-4">
                  {isLoadingLists ? (
                    <p className="text-center text-wiki-text-muted py-4">Loading lists...</p>
                  ) : lists.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-wiki-text-muted mb-3">You don&apos;t have any lists yet.</p>
                      <WikiButton
                        variant="primary"
                        onClick={() => {
                          setShowListModal(false);
                          window.location.href = "/lists";
                        }}
                      >
                        Create a List
                      </WikiButton>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-wiki-text-muted mb-3">Select a list:</p>
                      {lists.map((list) => (
                        <button
                          key={list.id}
                          onClick={() => addCitationToList(list.id)}
                          disabled={isAddingToList}
                          className="w-full text-left p-3 border border-wiki-border-light hover:bg-wiki-offwhite disabled:opacity-50"
                        >
                          {list.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </WikiLayout>
  );
}

export default function CitePage() {
  return (
    <Suspense fallback={
      <WikiLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-wiki-text-muted">Loading...</p>
        </div>
      </WikiLayout>
    }>
      <CitePageContent />
    </Suspense>
  );
}
