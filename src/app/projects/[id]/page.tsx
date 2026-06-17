"use client";

import { useState, useEffect, use, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiButton } from "@/components/wiki/wiki-button";
import { WikiNotice } from "@/components/wiki/wiki-notice";
import { WikiSpinner } from "@/components/wiki/wiki-spinner";
import { ShareDialog } from "@/components/wiki/share-dialog";
import { pickFactoid } from "@/lib/did-you-know";
import posthog from "posthog-js";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface List {
  id: string;
  name: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [project, setProject] = useState<Project | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [allLists, setAllLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showAddList, setShowAddList] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newListNameError, setNewListNameError] = useState<string | null>(null);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [editNameError, setEditNameError] = useState<string | null>(null);
  const [factoid, setFactoid] = useState<string>("");

  useEffect(() => {
    setFactoid(pickFactoid());
  }, []);

  const fetchProjectAndLists = useCallback(async () => {
    try {
      setIsLoading(true);

      // OPTIMIZATION: Execute independent network requests and JSON parsing concurrently
      // using Promise.all. This prevents a 3-step waterfall, reducing Time to First Byte
      // (TTFB) and overall load time significantly on this detail page.
      const [projectRes, allListsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch("/api/lists"),
      ]);

      const [projectResult, allListsResult] = await Promise.all([
        projectRes.json(),
        allListsRes.json(),
      ]);

      if (!projectResult.success) {
        setError(projectResult.error || "Project not found");
        return;
      }

      setProject(projectResult.data);
      setEditName(projectResult.data.name);
      setEditDescription(projectResult.data.description || "");

      if (allListsResult.success) {
        setAllLists(allListsResult.data);
        // OPTIMIZATION: Derive project lists in-memory to avoid redundant API request
        setLists(allListsResult.data.filter((list: List) => list.projectId === projectId));
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError("Failed to load project");
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(`/sign-in?redirect_url=/projects/${projectId}`);
      return;
    }

    if (isSignedIn && projectId) {
      fetchProjectAndLists();
    }
  }, [isLoaded, isSignedIn, projectId, router, fetchProjectAndLists]);

  const handleUpdateProject = async () => {
    if (!editName.trim()) {
      setEditNameError("Project name is required.");
      return;
    }
    setEditNameError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setProject(result.data);
        setIsEditing(false);
        posthog.capture("project_updated");
      } else {
        setError(result.error || "Failed to update project");
      }
    } catch (err) {
      console.error("Error updating project:", err);
      setError("Failed to update project");
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      setNewListNameError("List name is required.");
      return;
    }
    setNewListNameError(null);

    try {
      setIsCreating(true);
      const response = await fetch(`/api/projects/${projectId}/lists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setLists((prev) => [result.data, ...prev]);
        setAllLists((prev) => [result.data, ...prev]);
        setNewListName("");
        setShowAddList(false);
        posthog.capture("list_created", { in_project: true, project_id: projectId });
      } else {
        setError(result.error || "Failed to create list");
      }
    } catch (err) {
      console.error("Error creating list:", err);
      setError("Failed to create list");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveFromProject = async (listId: string) => {
    const listName = lists.find((l) => l.id === listId)?.name || "this list";
    // eslint-disable-next-line no-alert
    if (!confirm(`Remove "${listName}" from this project?`)) return;
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: null }),
      });

      const result = await response.json();

      if (result.success) {
        setLists((prev) => prev.filter((l) => l.id !== listId));
        posthog.capture("list_removed_from_project", { project_id: projectId });
      } else {
        setError(result.error || "Failed to remove list from project");
      }
    } catch (err) {
      console.error("Error removing list:", err);
      setError("Failed to remove list from project");
    }
  };

  const handleAddExistingList = async (listId: string) => {
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });

      const result = await response.json();

      if (result.success) {
        const addedList = allLists.find((l) => l.id === listId);
        if (addedList) {
          setLists((prev) => [...prev, { ...addedList, projectId }]);
        }
        posthog.capture("list_added_to_project", { project_id: projectId });
      } else {
        setError(result.error || "Failed to add list to project");
      }
    } catch (err) {
      console.error("Error adding list:", err);
      setError("Failed to add list to project");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const availableLists = useMemo(
    () => allLists.filter((list) => !list.projectId || list.projectId !== projectId),
    [allLists, projectId],
  );

  if (!isLoaded || (isLoaded && !isSignedIn)) {
    return (
      <WikiLayout>
        <WikiSpinner />
      </WikiLayout>
    );
  }

  if (isLoading) {
    return (
      <WikiLayout>
        <WikiSpinner />
      </WikiLayout>
    );
  }

  if (error && !project) {
    return (
      <WikiLayout>
        <WikiBreadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "My Projects", href: "/projects" },
            { label: "Error" },
          ]}
        />
        <div className="mt-6 p-6 border-l-4 border-l-wiki-border border border-wiki-border-light bg-wiki-offwhite text-wiki-text">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error}</p>
          <WikiButton onClick={() => router.push("/projects")} className="mt-4">
            Back to Projects
          </WikiButton>
        </div>
      </WikiLayout>
    );
  }

  return (
    <WikiLayout>
      <WikiBreadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My Projects", href: "/projects" },
          { label: project?.name || "Project" },
        ]}
      />

      <div className="mt-6">
        <div className="border border-wiki-border-light bg-wiki-white p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => { setEditName(e.target.value); setEditNameError(null); }}
                      className="w-full max-w-md"
                      aria-invalid={!!editNameError}
                      aria-describedby={editNameError ? "edit-project-name-error" : undefined}
                      autoFocus
                    />
                    {editNameError && (
                      <p id="edit-project-name-error" role="alert" className="mt-1 text-xs text-wiki-text">{editNameError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      className="w-full max-w-md h-20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <WikiButton onClick={handleUpdateProject}>Save</WikiButton>
                    <WikiButton onClick={() => { setIsEditing(false); setEditName(project?.name || ""); setEditDescription(project?.description || ""); setEditNameError(null); }}>
                      Cancel
                    </WikiButton>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold mb-1">
                    {project?.name}
                    <button
                      onClick={() => setIsEditing(true)}
                      className="ml-2 text-wiki-link text-sm font-normal hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                      aria-label={`Edit project ${project?.name}`}
                    >
                      [edit]
                    </button>
                  </h1>
                  {project?.description && (
                    <p className="text-wiki-text-muted mb-2">{project.description}</p>
                  )}
                  <p className="text-wiki-text-muted text-sm">
                    {lists.length} list{lists.length !== 1 ? "s" : ""}
                  </p>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <WikiButton onClick={() => setIsShareDialogOpen(true)}>
                Share
              </WikiButton>
              <WikiButton variant="primary" onClick={() => setShowAddList(!showAddList)}>
                {showAddList ? "Cancel" : "Add List"}
              </WikiButton>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4">
              <WikiNotice variant="warn" onDismiss={() => setError(null)}>{error}</WikiNotice>
            </div>
          )}

          {/* Add List Form */}
          {showAddList && (
            <div className="mb-6 p-4 border border-wiki-border-light bg-wiki-offwhite">
              <h2 className="font-bold text-base mb-3">Add List to Project</h2>

              {/* Create new list */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Create New List</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => { setNewListName(e.target.value); setNewListNameError(null); }}
                    placeholder="Enter list name..."
                    className="flex-1"
                    aria-invalid={!!newListNameError}
                    aria-describedby={newListNameError ? "add-list-name-error" : undefined}
                    aria-label="New list name"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateList()}
                    disabled={isCreating}
                  />
                  <WikiButton
                    variant="primary"
                    onClick={handleCreateList}
                    disabled={isCreating || !newListName.trim()}
                  >
                    {isCreating ? "Creating..." : "Create"}
                  </WikiButton>
                </div>
                {newListNameError && (
                  <p id="add-list-name-error" role="alert" className="mt-1 text-xs text-wiki-text">{newListNameError}</p>
                )}
              </div>

              {/* Add existing list */}
              {availableLists.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">Or Add Existing List</label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {availableLists.map((list) => (
                      <div
                        key={list.id}
                        className="flex items-center justify-between p-2 hover:bg-wiki-tab-bg"
                      >
                        <span>{list.name}</span>
                        <button
                          onClick={() => handleAddExistingList(list.id)}
                          className="text-wiki-link text-sm hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                        >
                          [add]
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Lists Table */}
          {lists.length === 0 ? (
            <div className="text-center py-8">
              <pre
                aria-hidden="true"
                className="inline-block font-mono text-xs leading-tight text-wiki-text-muted mb-4 select-none"
              >
{`   ┌───────┐
   │       │
   │   ·   │
   │       │
   └───────┘`}
              </pre>
              <p className="text-wiki-text-muted mb-4">
                This project has no lists yet.
              </p>
              <WikiButton variant="primary" onClick={() => setShowAddList(true)}>
                Add Your First List
              </WikiButton>
              {factoid && (
                <div className="mt-8 mx-auto max-w-lg border border-wiki-border-light bg-wiki-offwhite p-4 text-left text-sm">
                  <div className="font-bold mb-1 text-wiki-text">Did you know...</div>
                  <p className="text-wiki-text-muted italic">{factoid}</p>
                  <button
                    type="button"
                    onClick={() => setFactoid(pickFactoid())}
                    className="mt-2 text-xs text-wiki-link hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                  >
                    [another fact]
                  </button>
                </div>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-wiki-border-light">
                  <th scope="col" className="text-left py-2 px-2 font-semibold">Name</th>
                  <th scope="col" className="text-left py-2 px-2 font-semibold hidden sm:table-cell">Created</th>
                  <th scope="col" className="text-right py-2 px-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lists.map((list) => (
                  <tr
                    key={list.id}
                    className="border-b border-wiki-border-light hover:bg-wiki-offwhite"
                  >
                    <td className="py-3 px-2">
                      <a
                        href={`/lists/${list.id}`}
                        className="text-wiki-link hover:underline font-medium"
                      >
                        {list.name}
                      </a>
                    </td>
                    <td className="py-3 px-2 text-wiki-text-muted hidden sm:table-cell">
                      {formatDate(list.createdAt)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <span className="inline-flex gap-3">
                        <button
                          onClick={() => router.push(`/lists/${list.id}`)}
                          className="text-wiki-link hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                          aria-label={`View list ${list.name}`}
                        >
                          [view]
                        </button>
                        <button
                          onClick={() => handleRemoveFromProject(list.id)}
                          className="text-wiki-link hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text"
                          aria-label={`Remove list ${list.name} from project`}
                        >
                          [remove]
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Back Link */}
          <div className="mt-8 pt-6 border-t border-wiki-border-light">
            <Link href="/projects" className="text-wiki-link hover:underline focus-visible:outline-dotted focus-visible:outline-1 focus-visible:outline-wiki-text">
              &larr; Back to My Projects
            </Link>
          </div>
        </div>
      </div>

      <ShareDialog
        isOpen={isShareDialogOpen}
        onClose={() => setIsShareDialogOpen(false)}
        type="project"
        targetId={projectId}
        targetName={project?.name}
      />
    </WikiLayout>
  );
}
