"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiSpinner } from "@/components/wiki/wiki-spinner";
import { WikiNotice } from "@/components/wiki/wiki-notice";

interface SearchResults {
  query: string;
  projects: Array<{ id: string; name: string; description?: string }>;
  lists: Array<{ id: string; name: string; description?: string }>;
  citations: Array<{
    id: string;
    listId: string;
    listName: string;
    title: string;
    formattedText: string;
    tags?: string[];
  }>;
}

const DEBOUNCE_MS = 300;

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useUser();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/search");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    const trimmed = query.trim();
    const requestId = ++requestIdRef.current;

    // Keep the URL shareable/bookmarkable.
    const url = trimmed ? `/search?q=${encodeURIComponent(trimmed)}` : "/search";
    window.history.replaceState(null, "", url);

    if (trimmed.length < 2) {
      setResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        const data = await res.json();
        if (requestId !== requestIdRef.current) return; // stale response
        if (data.success) {
          setResults(data.data);
          setError(null);
        } else {
          setError(data.error || "Search failed");
        }
      } catch {
        if (requestId === requestIdRef.current) setError("Search failed");
      } finally {
        if (requestId === requestIdRef.current) setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isLoaded || (isLoaded && !isSignedIn)) {
    return (
      <WikiLayout>
        <WikiSpinner />
      </WikiLayout>
    );
  }

  const totalResults = results
    ? results.projects.length + results.lists.length + results.citations.length
    : 0;

  return (
    <WikiLayout>
      <WikiBreadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Search" }]}
      />

      <div className="mt-6">
        <div className="border border-wiki-border-light bg-wiki-white p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-1">Search</h1>
          <p className="text-wiki-text-muted text-sm mb-6">
            Search across all your projects, lists, and citations.
          </p>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, author, tag, note..."
            className="w-full"
            aria-label="Search your projects, lists, and citations"
            autoFocus
          />

          {error && (
            <div className="mt-4">
              <WikiNotice variant="warn" onDismiss={() => setError(null)}>{error}</WikiNotice>
            </div>
          )}

          <div className="mt-6" role="status" aria-live="polite">
            {query.trim().length < 2 ? (
              <p className="text-sm text-wiki-text-muted">
                Type at least two characters to search.
              </p>
            ) : isSearching ? (
              <WikiSpinner />
            ) : results && totalResults === 0 ? (
              <p className="text-sm text-wiki-text-muted">
                No results for &ldquo;{results.query}&rdquo;.
              </p>
            ) : results ? (
              <div className="space-y-8">
                {results.projects.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-2">
                      Projects ({results.projects.length})
                    </h2>
                    <ul className="divide-y divide-wiki-border-light border border-wiki-border-light">
                      {results.projects.map((project) => (
                        <li key={project.id} className="px-3 py-2">
                          <Link
                            href={`/projects/${project.id}`}
                            className="text-wiki-link hover:underline font-medium focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                          >
                            {project.name}
                          </Link>
                          {project.description && (
                            <p className="text-xs text-wiki-text-muted mt-0.5 line-clamp-2">
                              {project.description}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {results.lists.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-2">
                      Lists ({results.lists.length})
                    </h2>
                    <ul className="divide-y divide-wiki-border-light border border-wiki-border-light">
                      {results.lists.map((list) => (
                        <li key={list.id} className="px-3 py-2">
                          <Link
                            href={`/lists/${list.id}`}
                            className="text-wiki-link hover:underline font-medium focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                          >
                            {list.name}
                          </Link>
                          {list.description && (
                            <p className="text-xs text-wiki-text-muted mt-0.5 line-clamp-2">
                              {list.description}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {results.citations.length > 0 && (
                  <section>
                    <h2 className="text-lg font-semibold mb-2">
                      Citations ({results.citations.length})
                    </h2>
                    <ul className="divide-y divide-wiki-border-light border border-wiki-border-light">
                      {results.citations.map((citation) => (
                        <li key={citation.id} className="px-3 py-2">
                          <Link
                            href={`/lists/${citation.listId}`}
                            className="text-wiki-link hover:underline font-medium focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                          >
                            {citation.title || "Untitled"}
                          </Link>
                          <p className="citation-text text-xs text-wiki-text-muted mt-0.5 line-clamp-2">
                            {citation.formattedText}
                          </p>
                          <p className="text-xs text-wiki-text-muted mt-0.5">
                            In list:{" "}
                            <span className="font-medium">{citation.listName}</span>
                          </p>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </WikiLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <WikiLayout>
          <div className="flex items-center justify-center py-12">
            <span className="text-sm text-wiki-text-muted">Loading…</span>
          </div>
        </WikiLayout>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
