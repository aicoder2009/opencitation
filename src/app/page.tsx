"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiButton } from "@/components/wiki/wiki-button";

export default function LandingPage() {
  const router = useRouter();
  const [quickAddInput, setQuickAddInput] = useState("");

  const handleQuickAdd = () => {
    if (quickAddInput.trim()) {
      router.push(`/cite?input=${encodeURIComponent(quickAddInput.trim())}`);
    } else {
      router.push("/cite");
    }
  };

  const handleSourceTypeClick = (sourceType: string) => {
    router.push(`/cite?tab=manual&source=${sourceType}`);
  };

  return (
    <WikiLayout>
      <div className="mt-6">
        {/* Hero Section */}
        <div className="border border-[#a7d7f9] bg-[#f5faff] p-6 md:p-8 mb-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">OpenCitation</h1>
            <p className="text-wiki-text-muted text-lg mb-4">
              The free, open source citation manager
            </p>
            <p className="mb-6 max-w-xl mx-auto">
              Generate, organize, and share properly formatted citations.
              <br />
              No ads. No tracking. No account required.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <WikiButton variant="primary" onClick={() => router.push("/cite")}>
                Try It Now
              </WikiButton>
              <WikiButton onClick={() => window.open("https://github.com/aicoder2009/opencitation", "_blank")}>
                View on GitHub
              </WikiButton>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="border border-wiki-border-light bg-wiki-white p-6 md:p-8">
          {/* What is OpenCitation? */}
          <section className="mb-8">
            <h2 className="text-xl font-bold border-b border-wiki-border-light pb-2 mb-4">
              What is OpenCitation?
            </h2>
            <p className="mb-4">
              OpenCitation is a citation generator and organizer for students, researchers, and anyone
              who needs properly formatted references.
            </p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-start gap-2">
                <span className="text-wiki-text-muted">•</span>
                <span><b>Free to use</b> — no premium tiers, no paywalls</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-wiki-text-muted">•</span>
                <span><b>Ad-free</b> — no trackers, no pop-ups, no distractions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-wiki-text-muted">•</span>
                <span><b>Open source</b> — <Link href="https://github.com/aicoder2009/opencitation/blob/main/LICENSE" className="text-wiki-link hover:underline" target="_blank">MIT licensed</Link>, community-driven</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-wiki-text-muted">•</span>
                <span><b>Privacy-respecting</b> — we don&apos;t collect or sell your data</span>
              </li>
            </ul>
          </section>

          {/* Features Grid */}
          <section className="mb-8">
            <h2 className="text-xl font-bold border-b border-wiki-border-light pb-2 mb-4">
              Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {/* Citation Styles */}
              <div className="border border-wiki-border-light p-4">
                <h3 className="font-bold mb-2">Citation Styles</h3>
                <ul className="text-sm space-y-1">
                  <li>• APA 7th Edition</li>
                  <li>• MLA 9th Edition</li>
                  <li>• Chicago 17th Edition</li>
                  <li>• Harvard</li>
                </ul>
              </div>

              {/* Source Types */}
              <div className="border border-wiki-border-light p-4">
                <h3 className="font-bold mb-2">Source Types</h3>
                <ul className="text-sm space-y-1">
                  <li>• Books</li>
                  <li>• Academic Journals</li>
                  <li>• Websites &amp; Blogs</li>
                  <li>• Videos, Film, TV</li>
                  <li className="text-wiki-text-muted">+ 7 more types</li>
                </ul>
              </div>

              {/* Smart Lookup */}
              <div className="border border-wiki-border-light p-4">
                <h3 className="font-bold mb-2">Smart Lookup</h3>
                <ul className="text-sm space-y-1">
                  <li>• URL auto-detection</li>
                  <li>• DOI lookup (CrossRef)</li>
                  <li>• ISBN lookup</li>
                  <li className="text-wiki-text-muted">Paste and generate</li>
                </ul>
              </div>

              {/* Organization */}
              <div className="border border-wiki-border-light p-4">
                <h3 className="font-bold mb-2">Organization</h3>
                <ul className="text-sm space-y-1">
                  <li>• Lists — group by topic</li>
                  <li>• Projects — organize lists</li>
                  <li className="text-wiki-text-muted">Like playlists for citations</li>
                </ul>
              </div>

              {/* Sharing */}
              <div className="border border-wiki-border-light p-4">
                <h3 className="font-bold mb-2">Sharing</h3>
                <ul className="text-sm space-y-1">
                  <li>• Public share links</li>
                  <li>• View-only access</li>
                  <li className="text-wiki-text-muted">Share with classmates</li>
                </ul>
              </div>

              {/* Export */}
              <div className="border border-wiki-border-light p-4">
                <h3 className="font-bold mb-2">Export</h3>
                <ul className="text-sm space-y-1">
                  <li>• Copy to clipboard</li>
                  <li>• Download as .txt</li>
                  <li className="text-wiki-text-muted">Retro print animation</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Try It */}
          <section className="mb-8">
            <h2 className="text-xl font-bold border-b border-wiki-border-light pb-2 mb-4">
              Try It
            </h2>
            <p className="mb-4">
              Enter a URL, DOI, or ISBN to generate a citation:
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                placeholder="https://example.com or 10.1000/xyz or 978-0-123456-78-9"
                className="flex-1"
                value={quickAddInput}
                onChange={(e) => setQuickAddInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              />
              <WikiButton variant="primary" onClick={handleQuickAdd}>
                Generate
              </WikiButton>
            </div>
            <p className="text-sm text-wiki-text-muted mb-3">
              Or select a source type to enter details manually:
            </p>
            <div className="flex flex-wrap gap-2">
              <WikiButton onClick={() => handleSourceTypeClick("book")}>Book</WikiButton>
              <WikiButton onClick={() => handleSourceTypeClick("journal")}>Journal</WikiButton>
              <WikiButton onClick={() => handleSourceTypeClick("website")}>Website</WikiButton>
              <WikiButton onClick={() => router.push("/cite?tab=manual")}>More...</WikiButton>
            </div>
          </section>

          {/* Open Source */}
          <section className="mb-8">
            <h2 className="text-xl font-bold border-b border-wiki-border-light pb-2 mb-4">
              Open Source
            </h2>
            <p className="mb-4">
              OpenCitation is free software, released under the{" "}
              <Link href="https://github.com/aicoder2009/opencitation/blob/main/LICENSE" className="text-wiki-link hover:underline" target="_blank">
                MIT License
              </Link>.
              The complete source code is available on GitHub.
            </p>
            <div className="flex flex-wrap gap-3 mb-4">
              <WikiButton onClick={() => window.open("https://github.com/aicoder2009/opencitation", "_blank")}>
                Star on GitHub
              </WikiButton>
              <WikiButton onClick={() => window.open("https://github.com/aicoder2009/opencitation/issues", "_blank")}>
                Report an Issue
              </WikiButton>
              <WikiButton onClick={() => window.open("https://github.com/aicoder2009/opencitation/pulls", "_blank")}>
                Contribute
              </WikiButton>
            </div>
            <p className="text-sm text-wiki-text-muted">
              Built with: Next.js 16 • React 19 • Tailwind CSS • DynamoDB
            </p>
          </section>

          {/* Footer text */}
          <div className="border-t border-wiki-border-light pt-4 text-center text-sm text-wiki-text-muted">
            <p>
              OpenCitation is free software.{" "}
              <Link href="https://github.com/aicoder2009/opencitation" className="text-wiki-link hover:underline" target="_blank">
                View source on GitHub
              </Link>.
            </p>
            <p className="mt-1">
              Made for students who hate citation generators with ads.
            </p>
          </div>
        </div>
      </div>
    </WikiLayout>
  );
}
