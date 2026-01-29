"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiButton } from "@/components/wiki/wiki-button";

export default function LandingPage() {
  const router = useRouter();
  const [quickAddInput, setQuickAddInput] = useState("");
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showReportIssue, setShowReportIssue] = useState(false);
  const [reportMode, setReportMode] = useState<"choice" | "form">("choice");
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [issueType, setIssueType] = useState("Bug");
  const [issueEmail, setIssueEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string; issueUrl?: string } | null>(null);

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

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim() || !issueDescription.trim()) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch("/api/report-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: issueTitle,
          description: issueDescription,
          issueType,
          email: issueEmail || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitResult({
          success: true,
          message: `Issue #${data.issueNumber} created successfully!`,
          issueUrl: data.issueUrl,
        });
        // Reset form
        setIssueTitle("");
        setIssueDescription("");
        setIssueType("Bug");
        setIssueEmail("");
      } else {
        setSubmitResult({
          success: false,
          message: data.error || "Failed to submit issue. Please try again.",
        });
      }
    } catch {
      setSubmitResult({
        success: false,
        message: "Network error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeReportModal = () => {
    setShowReportIssue(false);
    setReportMode("choice");
    setSubmitResult(null);
  };

  return (
    <WikiLayout hideFooter>
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
                <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
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
                <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                Star on GitHub
              </WikiButton>
              <WikiButton onClick={() => setShowReportIssue(true)}>
                Report an Issue
              </WikiButton>
              <WikiButton onClick={() => window.open("https://github.com/aicoder2009/opencitation/pulls", "_blank")}>
                <svg className="w-4 h-4 inline-block mr-1.5 -mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
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
              Made <b>by</b> a student, <b>for</b> students who hate citation generators with ads.
            </p>
            <p className="mt-2">
              <button onClick={() => setShowPrivacy(true)} className="text-wiki-link hover:underline">Privacy Policy</button>
              {" · "}
              <button onClick={() => setShowTerms(true)} className="text-wiki-link hover:underline">Terms of Service</button>
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 bg-wiki-text/80 z-50 flex items-center justify-center p-4" onClick={() => setShowPrivacy(false)}>
          <div className="bg-wiki-white border border-wiki-border max-w-2xl h-[70vh] flex flex-col relative" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-wiki-border-light p-4 flex justify-between items-center bg-wiki-white shrink-0">
              <div>
                <h2 className="text-xl font-bold">Privacy Policy</h2>
                <p className="text-xs text-wiki-text-muted flex items-center gap-1">
                  <span className="animate-bounce inline-block">↓</span> Scroll to read all sections
                </p>
              </div>
              <button onClick={() => setShowPrivacy(false)} className="text-wiki-text-muted hover:text-wiki-text text-2xl leading-none">&times;</button>
            </div>
            <div className="p-4 text-sm space-y-4 pb-12 overflow-y-auto flex-1" style={{ scrollbarWidth: 'auto', scrollbarColor: '#aaa #f0f0f0' }}>
              <p><b>Last updated:</b> January 2025</p>

              <section>
                <h3 className="font-bold mb-2">Overview</h3>
                <p>OpenCitation is committed to protecting your privacy. This policy explains what data we collect and how we use it.</p>
              </section>

              <section>
                <h3 className="font-bold mb-2">Data We Collect</h3>
                <ul className="list-disc ml-5 space-y-1">
                  <li><b>Account Information:</b> If you create an account, we store your email address and display name via our authentication provider.</li>
                  <li><b>Citations &amp; Lists:</b> Citations you save, lists you create, and projects you organize are stored to provide the service.</li>
                  <li><b>Usage Data:</b> Basic analytics to improve the service (no personal tracking).</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold mb-2">Third-Party Services</h3>
                <p className="mb-2">We use the following third-party services:</p>
                <ul className="list-disc ml-5 space-y-1">
                  <li><b>Clerk</b> — Authentication and user management (<a href="https://clerk.com/privacy" target="_blank" className="text-wiki-link hover:underline">Privacy Policy</a>)</li>
                  <li><b>Amazon Web Services (DynamoDB)</b> — Database storage (<a href="https://aws.amazon.com/privacy/" target="_blank" className="text-wiki-link hover:underline">Privacy Policy</a>)</li>
                  <li><b>Vercel</b> — Hosting and deployment (<a href="https://vercel.com/legal/privacy-policy" target="_blank" className="text-wiki-link hover:underline">Privacy Policy</a>)</li>
                  <li><b>CrossRef API</b> — DOI metadata lookup (no personal data shared)</li>
                  <li><b>Open Library API</b> — ISBN metadata lookup (no personal data shared)</li>
                  <li><b>Google Books API</b> — ISBN metadata fallback (no personal data shared)</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold mb-2">Data Retention</h3>
                <p>Your data is retained as long as your account is active. You can delete your account and associated data at any time.</p>
              </section>

              <section>
                <h3 className="font-bold mb-2">Your Rights</h3>
                <p>You have the right to access, correct, or delete your personal data. For any privacy-related requests, contact us via GitHub issues.</p>
              </section>

              <section>
                <h3 className="font-bold mb-2">Contact</h3>
                <p>For privacy concerns, open an issue on our <a href="https://github.com/aicoder2009/opencitation/issues" target="_blank" className="text-wiki-link hover:underline">GitHub repository</a>.</p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Terms of Service Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-wiki-text/80 z-50 flex items-center justify-center p-4" onClick={() => setShowTerms(false)}>
          <div className="bg-wiki-white border border-wiki-border max-w-2xl h-[70vh] flex flex-col relative" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-wiki-border-light p-4 flex justify-between items-center bg-wiki-white shrink-0">
              <div>
                <h2 className="text-xl font-bold">Terms of Service</h2>
                <p className="text-xs text-wiki-text-muted flex items-center gap-1">
                  <span className="animate-bounce inline-block">↓</span> Scroll to read all sections
                </p>
              </div>
              <button onClick={() => setShowTerms(false)} className="text-wiki-text-muted hover:text-wiki-text text-2xl leading-none">&times;</button>
            </div>
            <div className="p-4 text-sm space-y-4 pb-12 overflow-y-auto flex-1" style={{ scrollbarWidth: 'auto', scrollbarColor: '#aaa #f0f0f0' }}>
              <p><b>Last updated:</b> January 2025</p>

              <section>
                <h3 className="font-bold mb-2">Acceptance of Terms</h3>
                <p>By using OpenCitation, you agree to these terms. If you do not agree, please do not use the service.</p>
              </section>

              <section>
                <h3 className="font-bold mb-2">Description of Service</h3>
                <p>OpenCitation is a free, open-source citation generator and organizer. The service is provided &quot;as is&quot; without warranties of any kind.</p>
              </section>

              <section>
                <h3 className="font-bold mb-2">User Responsibilities</h3>
                <ul className="list-disc ml-5 space-y-1">
                  <li>You are responsible for the accuracy of citations you generate and use.</li>
                  <li>You agree not to misuse the service or attempt to disrupt its operation.</li>
                  <li>You are responsible for maintaining the security of your account credentials.</li>
                </ul>
              </section>

              <section>
                <h3 className="font-bold mb-2">Intellectual Property</h3>
                <p>OpenCitation is open-source software released under the MIT License. You retain ownership of any citations and content you create.</p>
              </section>

              <section>
                <h3 className="font-bold mb-2">Limitation of Liability</h3>
                <p>OpenCitation and its contributors shall not be liable for any damages arising from the use of this service, including but not limited to incorrect citations, data loss, or service interruptions.</p>
              </section>

              <section>
                <h3 className="font-bold mb-2">Citation Accuracy</h3>
                <p>While we strive for accuracy, citation formats may contain errors. Always verify citations against official style guides before submission. OpenCitation is a tool to assist, not replace, proper citation practices.</p>
              </section>

              <section>
                <h3 className="font-bold mb-2">Modifications</h3>
                <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.</p>
              </section>

              <section>
                <h3 className="font-bold mb-2">Termination</h3>
                <p>We may terminate or suspend access to the service at any time, without notice, for conduct that violates these terms.</p>
              </section>

              <section>
                <h3 className="font-bold mb-2">Contact</h3>
                <p>For questions about these terms, open an issue on our <a href="https://github.com/aicoder2009/opencitation/issues" target="_blank" className="text-wiki-link hover:underline">GitHub repository</a>.</p>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {showReportIssue && (
        <div className="fixed inset-0 bg-wiki-text/80 z-50 flex items-center justify-center p-4" onClick={closeReportModal}>
          <div className="bg-wiki-white border border-wiki-border max-w-lg w-full max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="border-b border-wiki-border-light p-4 flex justify-between items-center bg-wiki-white shrink-0">
              <div>
                <h2 className="text-xl font-bold">Report an Issue</h2>
                <p className="text-xs text-wiki-text-muted">Help us improve OpenCitation</p>
              </div>
              <button onClick={closeReportModal} className="text-wiki-text-muted hover:text-wiki-text text-2xl leading-none">&times;</button>
            </div>
            <div className="p-4 overflow-y-auto flex-1" style={{ scrollbarWidth: 'auto', scrollbarColor: '#aaa #f0f0f0' }}>
              {/* Choice Screen */}
              {reportMode === "choice" && !submitResult && (
                <div className="space-y-4">
                  <p className="text-sm text-wiki-text-muted mb-4">Choose how you&apos;d like to report your issue:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* GitHub Option */}
                    <button
                      onClick={() => window.open("https://github.com/aicoder2009/opencitation/issues/new", "_blank")}
                      className="border border-wiki-border-light p-4 text-left hover:bg-wiki-offwhite transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        <span className="font-bold">GitHub Issues</span>
                      </div>
                      <p className="text-xs text-wiki-text-muted">Open an issue directly on GitHub. Best for developers or detailed bug reports.</p>
                    </button>

                    {/* Form Option */}
                    <button
                      onClick={() => setReportMode("form")}
                      className="border border-wiki-border-light p-4 text-left hover:bg-wiki-offwhite transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="font-bold">Quick Form</span>
                      </div>
                      <p className="text-xs text-wiki-text-muted">Use our simple form. No GitHub account needed — we&apos;ll create the issue for you.</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Form Screen */}
              {reportMode === "form" && !submitResult && (
                <form onSubmit={handleReportIssue} className="space-y-4">
                  <button
                    type="button"
                    onClick={() => setReportMode("choice")}
                    className="text-sm text-wiki-link hover:underline mb-2"
                  >
                    ← Back to options
                  </button>

                  <div>
                    <label className="block text-sm font-bold mb-1">Issue Type</label>
                    <select
                      value={issueType}
                      onChange={(e) => setIssueType(e.target.value)}
                      className="w-full border border-wiki-border-light p-2 text-sm bg-wiki-white"
                    >
                      <option value="Bug">Bug Report</option>
                      <option value="Feature">Feature Request</option>
                      <option value="Citation">Citation Format Issue</option>
                      <option value="Question">Question</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={issueTitle}
                      onChange={(e) => setIssueTitle(e.target.value)}
                      placeholder="Brief summary of the issue"
                      className="w-full border border-wiki-border-light p-2 text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">Description <span className="text-red-500">*</span></label>
                    <textarea
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      placeholder="Please describe the issue in detail. Include steps to reproduce if reporting a bug."
                      rows={5}
                      className="w-full border border-wiki-border-light p-2 text-sm resize-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-1">Email <span className="text-wiki-text-muted font-normal">(optional)</span></label>
                    <input
                      type="email"
                      value={issueEmail}
                      onChange={(e) => setIssueEmail(e.target.value)}
                      placeholder="For follow-up questions"
                      className="w-full border border-wiki-border-light p-2 text-sm"
                    />
                    <p className="text-xs text-wiki-text-muted mt-1"><b>Note:</b> This is a public repo — your email will be visible on GitHub if provided.</p>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <WikiButton type="submit" variant="primary" disabled={isSubmitting || !issueTitle.trim() || !issueDescription.trim()}>
                      {isSubmitting ? "Submitting..." : "Submit Issue"}
                    </WikiButton>
                    <WikiButton type="button" onClick={closeReportModal}>
                      Cancel
                    </WikiButton>
                  </div>
                </form>
              )}

              {/* Success/Error Result */}
              {submitResult && (
                <div className={`p-4 border ${submitResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                  <p className={`font-bold ${submitResult.success ? 'text-green-700' : 'text-red-700'}`}>
                    {submitResult.success ? 'Success!' : 'Error'}
                  </p>
                  <p className="mt-1">{submitResult.message}</p>
                  {submitResult.issueUrl && (
                    <p className="mt-2">
                      <a href={submitResult.issueUrl} target="_blank" className="text-wiki-link hover:underline">
                        View issue on GitHub →
                      </a>
                    </p>
                  )}
                  <div className="mt-4">
                    <WikiButton onClick={closeReportModal}>Close</WikiButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </WikiLayout>
  );
}
