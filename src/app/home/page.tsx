"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiButton } from "@/components/wiki/wiki-button";
import { WikiNotice } from "@/components/wiki/wiki-notice";

interface List {
  id: string;
  name: string;
  description?: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

function relativeDate(iso: string) {
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "1d";
  if (d < 30) return `${d}d`;
  if (d < 365) return `${Math.floor(d / 30)}mo`;
  return `${Math.floor(d / 365)}y`;
}

const SOURCE_TYPES = [
  { label: "Book", type: "book" },
  { label: "Journal", type: "journal" },
  { label: "Website", type: "website" },
  { label: "Blog", type: "blog" },
  { label: "Video", type: "video" },
];

export default function Dashboard() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();

  const [lists, setLists] = useState<List[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quickAddInput, setQuickAddInput] = useState("");
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isCreatingList, setIsCreatingList] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
      return;
    }
    if (isSignedIn) fetchUserData();
  }, [isLoaded, isSignedIn, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const [listsRes, projectsRes] = await Promise.all([
        fetch("/api/lists"),
        fetch("/api/projects"),
      ]);
      const [listsData, projectsData] = await Promise.all([
        listsRes.json(),
        projectsRes.json(),
      ]);
      if (listsData.success) setLists(listsData.data);
      if (projectsData.success) setProjects(projectsData.data);
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load your data. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = () => {
    posthog.capture("quick_add_initiated", { has_input: !!quickAddInput.trim() });
    if (quickAddInput.trim()) {
      router.push(`/cite?input=${encodeURIComponent(quickAddInput.trim())}`);
    } else {
      router.push("/cite");
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setIsCreatingList(true);
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewListName("");
        setShowNewListForm(false);
        await fetchUserData();
      } else {
        setError(data.error || "Failed to create list.");
      }
    } catch (err) {
      console.error("Error creating list:", err);
      setError("Failed to create list.");
    } finally {
      setIsCreatingList(false);
    }
  };

  const listCountForProject = (projectId: string) =>
    lists.filter((l) => l.projectId === projectId).length;

  const recentLists = lists.slice(0, 5);
  const recentProjects = projects.slice(0, 3);

  if (!isLoaded) return null;
  if (isLoaded && !isSignedIn) return null;

  return (
    <WikiLayout>
      <WikiBreadcrumbs items={[{ label: "Dashboard" }]} />

      {error && (
        <div className="mt-2">
          <WikiNotice variant="warn" onDismiss={() => setError(null)}>{error}</WikiNotice>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mt-2 mb-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <WikiButton variant="primary" onClick={() => router.push("/cite")}>
          New Citation →
        </WikiButton>
      </div>

      {/* Quick Add — full width, top of page */}
      <div className="border border-wiki-border-light p-3 mb-8">
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            placeholder="URL, DOI, ISBN, arXiv, PubMed…"
            className="flex-1 text-sm px-2 py-1.5 border border-wiki-border-light bg-wiki-white text-wiki-text focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
            value={quickAddInput}
            onChange={(e) => setQuickAddInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
          />
          <WikiButton variant="primary" onClick={handleQuickAdd}>
            Generate
          </WikiButton>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-wiki-text-muted text-xs">Manual:</span>
          {SOURCE_TYPES.map(({ label, type }) => (
            <button
              key={type}
              onClick={() => {
                posthog.capture("dashboard_source_type_clicked", { source_type: type });
                router.push(`/cite?tab=manual&source=${type}`);
              }}
              className="text-wiki-link hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
            >
              {label}
            </button>
          ))}
          <Link href="/cite?tab=manual" className="text-wiki-link hover:underline">
            More →
          </Link>
        </div>
      </div>

      {/* My Lists section */}
      <div className="mb-8">
        <div className="flex items-center justify-between border-b-2 border-wiki-border pb-1 mb-0">
          <h2 className="text-lg font-semibold">
            My Lists{!isLoading && ` (${lists.length})`}
          </h2>
          {!showNewListForm && (
            <button
              className="text-sm text-wiki-link hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
              onClick={() => setShowNewListForm(true)}
            >
              + New List
            </button>
          )}
        </div>

        {isLoading && (
          <p className="py-3 text-sm text-wiki-text-muted">Loading…</p>
        )}

        {!isLoading && recentLists.length === 0 && !showNewListForm && (
          <p className="py-3 text-sm text-wiki-text-muted">
            No lists yet.{" "}
            <button
              className="text-wiki-link hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
              onClick={() => setShowNewListForm(true)}
            >
              Create your first list
            </button>
          </p>
        )}

        {!isLoading && recentLists.length > 0 && (
          <>
            {recentLists.map((list) => (
              <div
                key={list.id}
                className="flex items-center justify-between py-1.5 border-b border-wiki-border-light"
              >
                <Link
                  href={`/lists/${list.id}`}
                  className="text-sm text-wiki-link hover:underline"
                >
                  {list.name}
                </Link>
                <span className="text-xs text-wiki-text-muted tabular-nums">
                  {relativeDate(list.createdAt)}
                </span>
              </div>
            ))}
          </>
        )}

        {showNewListForm && (
          <div className="flex items-center gap-2 py-2 border-b border-wiki-border-light">
            <input
              type="text"
              className="flex-1 text-sm px-2 py-1 border border-wiki-border-light bg-wiki-white text-wiki-text focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
              placeholder="List name…"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateList();
                if (e.key === "Escape") { setShowNewListForm(false); setNewListName(""); }
              }}
              autoFocus
            />
            <WikiButton
              variant="primary"
              onClick={handleCreateList}
              disabled={isCreatingList || !newListName.trim()}
            >
              Create
            </WikiButton>
            <WikiButton onClick={() => { setShowNewListForm(false); setNewListName(""); }}>
              Cancel
            </WikiButton>
          </div>
        )}

        {!isLoading && (
          <div className="pt-2">
            <Link href="/lists" className="text-sm text-wiki-link hover:underline">
              {lists.length > 5
                ? `View all ${lists.length} lists →`
                : "View all lists →"}
            </Link>
          </div>
        )}
      </div>

      {/* My Projects section */}
      <div className="mb-8">
        <div className="flex items-center justify-between border-b-2 border-wiki-border pb-1 mb-0">
          <h2 className="text-lg font-semibold">
            My Projects{!isLoading && ` (${projects.length})`}
          </h2>
          <Link
            href="/projects"
            className="text-sm text-wiki-link hover:underline"
          >
            + New Project
          </Link>
        </div>

        {isLoading && (
          <p className="py-3 text-sm text-wiki-text-muted">Loading…</p>
        )}

        {!isLoading && recentProjects.length === 0 && (
          <p className="py-3 text-sm text-wiki-text-muted">
            No projects yet.{" "}
            <Link href="/projects" className="text-wiki-link hover:underline">
              Create your first project
            </Link>
          </p>
        )}

        {!isLoading && recentProjects.length > 0 && (
          <>
            {recentProjects.map((project) => {
              const count = listCountForProject(project.id);
              return (
                <div
                  key={project.id}
                  className="flex items-center gap-6 py-1.5 border-b border-wiki-border-light"
                >
                  <Link
                    href={`/projects/${project.id}`}
                    className="text-sm text-wiki-link hover:underline flex-1 truncate"
                  >
                    {project.name}
                  </Link>
                  <span className="text-xs text-wiki-text-muted shrink-0">
                    {count} {count === 1 ? "list" : "lists"}
                  </span>
                  <span className="text-xs text-wiki-text-muted tabular-nums shrink-0">
                    {relativeDate(project.updatedAt)}
                  </span>
                </div>
              );
            })}
          </>
        )}

        {!isLoading && (
          <div className="pt-2">
            <Link href="/projects" className="text-sm text-wiki-link hover:underline">
              {projects.length > 3
                ? `View all ${projects.length} projects →`
                : "View all projects →"}
            </Link>
          </div>
        )}
      </div>
    </WikiLayout>
  );
}
