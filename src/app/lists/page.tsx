"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiButton } from "@/components/wiki/wiki-button";

interface List {
  id: string;
  name: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ListsPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newListName, setNewListName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect_url=/lists");
      return;
    }

    if (isSignedIn) {
      fetchLists();
    }
  }, [isLoaded, isSignedIn, router]);

  const fetchLists = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/lists");
      const result = await response.json();

      if (result.success) {
        setLists(result.data);
      } else {
        setError(result.error || "Failed to fetch lists");
      }
    } catch (err) {
      console.error("Error fetching lists:", err);
      setError("Failed to fetch lists");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListName.trim()) return;

    try {
      setIsCreating(true);
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newListName.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setLists((prev) => [result.data, ...prev]);
        setNewListName("");
        setShowCreateForm(false);
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

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!confirm(`Are you sure you want to delete "${listName}"? This will also delete all citations in this list.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/lists/${listId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        setLists((prev) => prev.filter((list) => list.id !== listId));
      } else {
        setError(result.error || "Failed to delete list");
      }
    } catch (err) {
      console.error("Error deleting list:", err);
      setError("Failed to delete list");
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
          { label: "My Lists" },
        ]}
      />

      <div className="mt-6">
        <div className="border border-wiki-border-light bg-wiki-white p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">My Lists</h1>
              <p className="text-wiki-text-muted text-sm">
                Organize your citations into lists
              </p>
            </div>
            <WikiButton
              variant="primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
            >
              {showCreateForm ? "Cancel" : "Create List"}
            </WikiButton>
          </div>

          {/* Create List Form */}
          {showCreateForm && (
            <div className="mb-6 p-4 border border-wiki-border-light bg-wiki-offwhite">
              <h3 className="font-bold mb-3">Create New List</h3>
              <div className="flex gap-3">
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

          {/* Lists Table */}
          {isLoading ? (
            <div className="text-center py-8 text-wiki-text-muted">
              Loading lists...
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-wiki-text-muted mb-4">
                You don&apos;t have any lists yet.
              </p>
              <WikiButton variant="primary" onClick={() => setShowCreateForm(true)}>
                Create Your First List
              </WikiButton>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-wiki-border-light">
                  <th className="text-left py-2 px-2 font-semibold">Name</th>
                  <th className="text-left py-2 px-2 font-semibold hidden sm:table-cell">Created</th>
                  <th className="text-left py-2 px-2 font-semibold hidden sm:table-cell">Updated</th>
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
                    <td className="py-3 px-2 text-wiki-text-muted hidden sm:table-cell">
                      {formatDate(list.updatedAt)}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={() => router.push(`/lists/${list.id}`)}
                        className="text-wiki-link hover:underline mr-3"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteList(list.id, list.name)}
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
