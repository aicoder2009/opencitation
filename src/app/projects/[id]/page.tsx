"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiButton } from "@/components/wiki/wiki-button";

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
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push(`/sign-in?redirect_url=/projects/${projectId}`);
      return;
    }

    if (isSignedIn && projectId) {
      fetchProjectAndLists();
    }
  }, [isLoaded, isSignedIn, projectId, router]);

  const fetchProjectAndLists = async () => {
    try {
      setIsLoading(true);

      // Fetch project details
      const projectResponse = await fetch(`/api/projects/${projectId}`);
      const projectResult = await projectResponse.json();

      if (!projectResult.success) {
        setError(projectResult.error || "Project not found");
        return;
      }

      setProject(projectResult.data);
      setEditName(projectResult.data.name);
      setEditDescription(projectResult.data.description || "");

      // Fetch lists in project
      const listsResponse = await fetch(`/api/projects/${projectId}/lists`);
      const listsResult = await listsResponse.json();

      if (listsResult.success) {
        setLists(listsResult.data);
      }

      // Fetch all user lists (for adding to project)
      const allListsResponse = await fetch("/api/lists");
      const allListsResult = await allListsResponse.json();

      if (allListsResult.success) {
        setAllLists(allListsResult.data);
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError("Failed to load project");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProject = async () => {
    if (!editName.trim()) {
      setIsEditing(false);
      return;
    }

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
      } else {
        setError(result.error || "Failed to update project");
      }
    } catch (err) {
      console.error("Error updating project:", err);
      setError("Failed to update project");
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

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
    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: null }),
      });

      const result = await response.json();

      if (result.success) {
        setLists((prev) => prev.filter((l) => l.id !== listId));
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
      } else {
        setError(result.error || "Failed to add list to project");
      }
    } catch (err) {
      console.error("Error adding list:", err);
      setError("Failed to add list to project");
    }
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      const response = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "project",
          targetId: projectId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const url = `${window.location.origin}/share/${result.data.code}`;
        setShareUrl(url);
        navigator.clipboard.writeText(url);
      } else {
        setError(result.error || "Failed to create share link");
      }
    } catch (err) {
      console.error("Error sharing:", err);
      setError("Failed to create share link");
    } finally {
      setIsSharing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Lists that can be added to this project (not already in it)
  const availableLists = allLists.filter(
    (list) => !list.projectId || list.projectId !== projectId
  );

  if (!isLoaded || (isLoaded && !isSignedIn)) {
    return (
      <WikiLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-wiki-text-muted">Loading...</p>
        </div>
      </WikiLayout>
    );
  }

  if (isLoading) {
    return (
      <WikiLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-wiki-text-muted">Loading project...</p>
        </div>
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
        <div className="mt-6 p-6 border border-red-200 bg-red-50 text-red-700">
          <h2 className="font-bold mb-2">Error</h2>
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
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full max-w-md"
                      autoFocus
                    />
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
                    <WikiButton onClick={() => { setIsEditing(false); setEditName(project?.name || ""); setEditDescription(project?.description || ""); }}>
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
                      className="ml-2 text-wiki-link text-sm font-normal hover:underline"
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
              <WikiButton onClick={handleShare} disabled={isSharing}>
                {isSharing ? "Sharing..." : "Share"}
              </WikiButton>
              <WikiButton variant="primary" onClick={() => setShowAddList(!showAddList)}>
                {showAddList ? "Cancel" : "Add List"}
              </WikiButton>
            </div>
          </div>

          {/* Share URL */}
          {shareUrl && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm">
              Share link copied to clipboard: {shareUrl}
              <button
                onClick={() => setShareUrl(null)}
                className="ml-2 text-green-500 hover:text-green-700"
              >
                [dismiss]
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                [dismiss]
              </button>
            </div>
          )}

          {/* Add List Form */}
          {showAddList && (
            <div className="mb-6 p-4 border border-wiki-border-light bg-wiki-offwhite">
              <h3 className="font-bold mb-3">Add List to Project</h3>

              {/* Create new list */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Create New List</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Enter list name..."
                    className="flex-1"
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
              </div>

              {/* Add existing list */}
              {availableLists.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1">Or Add Existing List</label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {availableLists.map((list) => (
                      <div
                        key={list.id}
                        className="flex items-center justify-between p-2 hover:bg-white"
                      >
                        <span>{list.name}</span>
                        <button
                          onClick={() => handleAddExistingList(list.id)}
                          className="text-wiki-link text-sm hover:underline"
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
              <p className="text-wiki-text-muted mb-4">
                This project has no lists yet.
              </p>
              <WikiButton variant="primary" onClick={() => setShowAddList(true)}>
                Add Your First List
              </WikiButton>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-wiki-border-light">
                  <th className="text-left py-2 px-2 font-semibold">Name</th>
                  <th className="text-left py-2 px-2 font-semibold hidden sm:table-cell">Created</th>
                  <th className="text-right py-2 px-2 font-semibold">Actions</th>
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
                      <button
                        onClick={() => router.push(`/lists/${list.id}`)}
                        className="text-wiki-link hover:underline mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleRemoveFromProject(list.id)}
                        className="text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Back Link */}
          <div className="mt-8 pt-6 border-t border-wiki-border-light">
            <a href="/projects" className="text-wiki-link hover:underline">
              &larr; Back to My Projects
            </a>
          </div>
        </div>
      </div>
    </WikiLayout>
  );
}
