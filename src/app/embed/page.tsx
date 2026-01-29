"use client";

import { useState } from "react";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiButton } from "@/components/wiki/wiki-button";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";

export default function EmbedPage() {
  const [pageUrl, setPageUrl] = useState("");
  const [copied, setCopied] = useState<"html" | "markdown" | null>(null);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://opencitation.vercel.app";

  const citeUrl = pageUrl
    ? `${baseUrl}/cite?input=${encodeURIComponent(pageUrl)}`
    : `${baseUrl}/cite`;

  const badgeUrl = `${baseUrl}/api/badge`;

  const htmlCode = `<a href="${citeUrl}" target="_blank" rel="noopener noreferrer">
  <img src="${badgeUrl}" alt="Cite with OpenCitation" width="150" height="26" />
</a>`;

  const markdownCode = `[![Cite with OpenCitation](${badgeUrl})](${citeUrl})`;

  const handleCopy = (type: "html" | "markdown") => {
    const code = type === "html" ? htmlCode : markdownCode;
    navigator.clipboard.writeText(code);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <WikiLayout>
      <WikiBreadcrumbs items={[{ label: "Home", href: "/" }, { label: "Embed Badge" }]} />

      <div className="mt-6">
        <h1 className="text-2xl font-bold mb-4">Cite This Page Badge</h1>
        <p className="text-wiki-text-muted mb-6">
          Add a &quot;Cite with OpenCitation&quot; badge to your website, blog, or documentation.
          Visitors can click it to generate a proper citation for your page.
        </p>

        {/* Badge Preview */}
        <div className="border border-wiki-border-light bg-wiki-white p-6 mb-6">
          <h2 className="font-bold mb-4">Preview</h2>
          <div className="flex items-center gap-4 p-4 bg-[#f9f9f9] border border-wiki-border-light">
            <a href={citeUrl} target="_blank" rel="noopener noreferrer">
              <img src={badgeUrl} alt="Cite with OpenCitation" width={150} height={26} />
            </a>
            <span className="text-wiki-text-muted text-sm">Click to test</span>
          </div>
        </div>

        {/* URL Input */}
        <div className="border border-wiki-border-light bg-wiki-white p-6 mb-6">
          <h2 className="font-bold mb-4">Your Page URL (Optional)</h2>
          <p className="text-wiki-text-muted text-sm mb-3">
            Enter your page URL to pre-fill the citation form when visitors click the badge.
          </p>
          <input
            type="url"
            value={pageUrl}
            onChange={(e) => setPageUrl(e.target.value)}
            placeholder="https://example.com/your-article"
            className="w-full border border-wiki-border-light p-2 text-base focus:border-wiki-link focus:outline-none"
          />
        </div>

        {/* HTML Code */}
        <div className="border border-wiki-border-light bg-wiki-white p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">HTML Code</h2>
            <WikiButton
              variant={copied === "html" ? "primary" : "default"}
              onClick={() => handleCopy("html")}
              className="text-xs px-2 py-1"
            >
              {copied === "html" ? "Copied!" : "Copy"}
            </WikiButton>
          </div>
          <pre className="bg-[#f5f5f5] border border-wiki-border-light p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap">
            {htmlCode}
          </pre>
        </div>

        {/* Markdown Code */}
        <div className="border border-wiki-border-light bg-wiki-white p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold">Markdown Code</h2>
            <WikiButton
              variant={copied === "markdown" ? "primary" : "default"}
              onClick={() => handleCopy("markdown")}
              className="text-xs px-2 py-1"
            >
              {copied === "markdown" ? "Copied!" : "Copy"}
            </WikiButton>
          </div>
          <pre className="bg-[#f5f5f5] border border-wiki-border-light p-4 overflow-x-auto text-sm font-mono whitespace-pre-wrap">
            {markdownCode}
          </pre>
        </div>

        {/* Usage Tips */}
        <div className="border border-[#e2b979] bg-[#fdf8e8] p-6">
          <h2 className="font-bold mb-3">Usage Tips</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Add the badge to your blog posts, research papers, or documentation</li>
            <li>Place it near your content header or footer for visibility</li>
            <li>The badge links to OpenCitation with your page URL pre-filled</li>
            <li>Works with any website, blog platform, or static site generator</li>
          </ul>
        </div>
      </div>
    </WikiLayout>
  );
}
