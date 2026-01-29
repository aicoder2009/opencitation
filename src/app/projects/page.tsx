"use client";

import { useState, useEffect } from "react";
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

  const handleDeleteProject = async (projectId: string, projectName: string) => {
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
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-wiki-border-light">
                  <th className="text-left py-2 px-2 font-semibold">Name</th>
                  <th className="text-left py-2 px-2 font-semibold hidden md:table-cell">Description</th>
                  <th className="text-left py-2 px-2 font-semibold hidden sm:table-cell">Created</th>
                  <th className="text-right py-2 px-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-wiki-border-light hover:bg-wiki-offwhite"
                  >
                    <td className="py-3 px-2">
                      <a
                        href={`/projects/${project.id}`}
                        className="text-wiki-link hover:underline font-medium"
                      >
                        {project.name}
                      </a>
                    </td>
                    <td className="py-3 px-2 text-wiki-text-muted hidden md:table-cell">
                      {project.description || "-"}
                    </td>
                    <td className="py-3 px-2 text-wiki-text-muted hidden sm:table-cell">
                      {formatDate(project.createdAt)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => router.push(`/projects/${project.id}`)}
                        className="text-wiki-link hover:underline mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id, project.name)}
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
