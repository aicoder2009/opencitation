"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiButton } from "@/components/wiki/wiki-button";
import posthog from "posthog-js";

interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/projects");
      return;
    }

    if (isSignedIn) {
      fetchProjects();
    }
  }, [isLoaded, isSignedIn, router]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/projects");
      const result = await response.json();

      if (result.success) {
        setProjects(result.data);
      } else {
        setError(result.error || "Failed to fetch projects");
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError("Failed to fetch projects");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;

    try {
      setIsCreating(true);
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjectName.trim(),
          description: newProjectDescription.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setProjects((prev) => [result.data, ...prev]);
        setNewProjectName("");
        setNewProjectDescription("");
        setShowCreateForm(false);
        posthog.capture("project_created", {
          has_description: !!newProjectDescription.trim(),
        });
      } else {
        setError(result.error || "Failed to create project");
      }
    } catch (err) {
      console.error("Error creating project:", err);
      setError("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  const startEditing = (project: Project) => {
    setEditingProjectId(project.id);
    setEditName(project.name);
    setEditDescription(project.description || "");
    setError(null);
  };

  const cancelEditing = () => {
    setEditingProjectId(null);
    setEditName("");
    setEditDescription("");
  };

  const handleSaveEdit = async (projectId: string) => {
    if (!editName.trim()) return;

    try {
      setIsSavingEdit(true);
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        setProjects((prev) =>
          prev.map((p) => (p.id === projectId ? result.data : p))
        );
        cancelEditing();
        posthog.capture("project_updated");
      } else {
        setError(result.error || "Failed to update project");
      }
    } catch (err) {
      console.error("Error updating project:", err);
      setError("Failed to update project");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm(`Are you sure you want to delete "${projectName}"? Lists in this project will not be deleted but will become standalone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setProjects((prev) => prev.filter((project) => project.id !== projectId));
        posthog.capture("project_deleted");
      } else {
        setError(result.error || "Failed to delete project");
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      setError("Failed to delete project");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isLoaded || (isLoaded && !isSignedIn)) {
    return (
      <WikiLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-wiki-text-muted">Loading...</p>
        </div>
      </WikiLayout>
    );
  }

  return (
    <WikiLayout>
      <WikiBreadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "My Projects" },
        ]}
      />

      <div className="mt-6">
        <div className="border border-wiki-border-light bg-wiki-white p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">My Projects</h1>
              <p className="text-wiki-text-muted text-sm">
                Organize your citation lists into projects
              </p>
            </div>
            <WikiButton
              variant="primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? "Cancel" : "Create Project"}
            </WikiButton>
          </div>

          {/* Create Project Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 border border-wiki-border-light bg-wiki-offwhite">
              <h3 className="font-bold mb-3">Create New Project</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Enter project name..."
                    className="w-full"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description (optional)</label>
                  <textarea
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    placeholder="Enter project description..."
                    className="w-full h-20"
                    disabled={isCreating}
                  />
                </div>
                <WikiButton
                  variant="primary"
                  onClick={handleCreateProject}
                  disabled={isCreating || !newProjectName.trim()}
                >
                  {isCreating ? "Creating..." : "Create"}
                </WikiButton>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-wiki-offwhite border-l-4 border-l-wiki-border border border-wiki-border-light text-wiki-text text-sm">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 text-wiki-link hover:underline"
                aria-label="Dismiss error"
              >
                [dismiss]
              </button>
            </div>
          )}

          {/* Projects Table */}
          {isLoading ? (
            <div className="text-center py-8 text-wiki-text-muted">
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-wiki-text-muted mb-4">
                You don&apos;t have any projects yet.
              </p>
              <WikiButton variant="primary" onClick={() => setShowCreateForm(true)}>
                Create Your First Project
              </WikiButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => {
                const isEditing = editingProjectId === project.id;
                return (
                  <div
                    key={project.id}
                    className="flex flex-col border border-wiki-border-light bg-wiki-white hover:bg-wiki-offwhite transition-colors"
                  >
                    <div className="p-4 flex-1">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-xs font-medium text-wiki-text-muted mb-1">
                              Name
                            </label>
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-wiki-border-light"
                              placeholder="Project name"
                              disabled={isSavingEdit}
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-wiki-text-muted mb-1">
                              Description (optional)
                            </label>
                            <textarea
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-wiki-border-light h-20"
                              placeholder="Project description"
                              disabled={isSavingEdit}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-lg font-bold mb-1 leading-tight">
                            <a
                              href={`/projects/${project.id}`}
                              className="text-wiki-link hover:underline"
                            >
                              {project.name}
                            </a>
                          </h2>
                          <p className="text-xs text-wiki-text-muted mb-3">
                            Created {formatDate(project.createdAt)}
                          </p>
                          {project.description ? (
                            <p className="text-sm line-clamp-3">{project.description}</p>
                          ) : (
                            <p className="text-sm text-wiki-text-muted italic">
                              No description
                            </p>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 border-t border-wiki-border-light bg-wiki-tab-bg text-sm">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(project.id)}
                            disabled={isSavingEdit || !editName.trim()}
                            className="text-wiki-link hover:underline disabled:opacity-50 disabled:no-underline"
                          >
                            {isSavingEdit ? "Saving..." : "Save"}
                          </button>
                          <span className="text-wiki-border-light">|</span>
                          <button
                            onClick={cancelEditing}
                            disabled={isSavingEdit}
                            className="text-wiki-text-muted hover:underline"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => router.push(`/projects/${project.id}`)}
                            className="text-wiki-link hover:underline"
                          >
                            View
                          </button>
                          <span className="text-wiki-border-light">|</span>
                          <button
                            onClick={() => startEditing(project)}
                            className="text-wiki-link hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id, project.name)}
                            className="text-wiki-link hover:underline ml-auto"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-8 pt-6 border-t border-wiki-border-light">
            <h3 className="font-bold mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <WikiButton onClick={() => router.push("/lists")}>
                View My Lists
              </WikiButton>
              <WikiButton onClick={() => router.push("/cite")}>
                Create New Citation
              </WikiButton>
            </div>
          </div>
        </div>
      </div>
    </WikiLayout>
  );
}
