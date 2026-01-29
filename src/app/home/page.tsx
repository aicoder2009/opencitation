"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignedIn, SignedOut } from "@clerk/nextjs";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiCollapsible } from "@/components/wiki/wiki-collapsible";
import { WikiButton } from "@/components/wiki/wiki-button";

interface List {
  id: string;
  name: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [quickAddInput, setQuickAddInput] = useState("");
  const [recentLists, setRecentLists] = useState<List[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch user's lists and projects when signed in
  useEffect(() => {
    if (isSignedIn) {
      fetchUserData();
    }
  }, [isSignedIn]);

  const fetchUserData = async () => {
    setIsLoadingData(true);
    try {
      const [listsRes, projectsRes] = await Promise.all([
        fetch("/api/lists"),
        fetch("/api/projects"),
      ]);

      const listsData = await listsRes.json();
      const projectsData = await projectsRes.json();

      if (listsData.success) {
        // Get 3 most recent lists
        setRecentLists(listsData.data.slice(0, 3));
      }
      if (projectsData.success) {
        // Get 3 most recent projects
        setRecentProjects(projectsData.data.slice(0, 3));
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleQuickAdd = () => {
    if (quickAddInput.trim()) {
      // Navigate to cite page with the input pre-filled
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
      <WikiBreadcrumbs
        items={[
          { label: "Dashboard" },
        ]}
      />

      <div className="mt-6">
        <div className="border border-wiki-border-light bg-wiki-white p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-wiki-text-muted text-sm border-b border-wiki-border-light pb-4 mb-6">
            Your citation workspace
          </p>

          {/* Welcome box - 2000s Wikipedia portal style */}
          <div className="border border-[#a7d7f9] bg-[#f5faff] p-4 mb-6">
            <SignedOut>
              <div className="text-center mb-3">
                <span className="text-lg font-bold">Welcome to OpenCitation</span>
              </div>
              <div className="text-center text-sm mb-4">
                The free, ad-free citation generator for students and researchers.
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm">
                <span><b>4</b> citation styles</span>
                <span><b>11</b> source types</span>
                <span><b>3</b> lookup methods</span>
              </div>
            </SignedOut>

            <SignedIn>
              <div className="text-center mb-3">
                <span className="text-lg font-bold">Welcome back!</span>
              </div>
              <div className="text-center text-sm mb-4">
                Ready to create more citations?
              </div>
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-1 text-sm">
                <span><b>{recentLists.length}</b> {recentLists.length === 1 ? "list" : "lists"}</span>
                <span><b>{recentProjects.length}</b> {recentProjects.length === 1 ? "project" : "projects"}</span>
                <span><b>4</b> citation styles</span>
              </div>
              <div className="text-center mt-3">
                <WikiButton variant="primary" onClick={() => router.push("/cite")}>
                  Create Citation
                </WikiButton>
              </div>
            </SignedIn>
          </div>

          {/* Brief intro */}
          <p className="mb-4 text-sm">
            <b>OpenCitation</b> generates properly formatted citations from URLs, DOIs, and ISBNs.
            Supports <a href="/cite" className="text-wiki-link hover:underline">APA</a>,{" "}
            <a href="/cite" className="text-wiki-link hover:underline">MLA</a>,{" "}
            <a href="/cite" className="text-wiki-link hover:underline">Chicago</a>, and{" "}
            <a href="/cite" className="text-wiki-link hover:underline">Harvard</a> styles.
            No ads. No account required. <a href="https://github.com/aicoder2009/opencitation" className="text-wiki-link hover:underline" target="_blank" rel="noopener">Open source</a>.
          </p>

          <WikiCollapsible title="Contents" defaultOpen>
            <nav className="text-sm">
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  <a href="#quick-add" className="text-wiki-link hover:underline">Quick Add</a>
                </li>
                <li>
                  <a href="#manual-entry" className="text-wiki-link hover:underline">Manual Entry</a>
                </li>
                <li>
                  <a href="#my-citations" className="text-wiki-link hover:underline">My Citations</a>
                </li>
              </ol>
            </nav>
          </WikiCollapsible>

          <section id="quick-add" className="mt-8">
            <h2 className="text-xl font-bold border-b border-wiki-border-light pb-2 mb-4">
              Quick Add
            </h2>
            <p className="mb-4">
              Enter a URL, DOI, or ISBN to automatically generate a citation.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter URL, DOI, or ISBN..."
                className="flex-1"
                value={quickAddInput}
                onChange={(e) => setQuickAddInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickAdd()}
              />
              <WikiButton variant="primary" onClick={handleQuickAdd}>
                Generate Citation
              </WikiButton>
            </div>
          </section>

          <section id="manual-entry" className="mt-8">
            <h2 className="text-xl font-bold border-b border-wiki-border-light pb-2 mb-4">
              Manual Entry
            </h2>
            <p className="mb-4">
              Select a source type and enter the citation details manually.
            </p>
            <div className="flex flex-wrap gap-2">
              <WikiButton onClick={() => handleSourceTypeClick("book")}>Book</WikiButton>
              <WikiButton onClick={() => handleSourceTypeClick("journal")}>Journal</WikiButton>
              <WikiButton onClick={() => handleSourceTypeClick("website")}>Website</WikiButton>
              <WikiButton onClick={() => handleSourceTypeClick("blog")}>Blog</WikiButton>
              <WikiButton onClick={() => handleSourceTypeClick("newspaper")}>Newspaper</WikiButton>
              <WikiButton onClick={() => handleSourceTypeClick("video")}>Video</WikiButton>
              <WikiButton onClick={() => router.push("/cite?tab=manual")}>More...</WikiButton>
            </div>
          </section>

          <section id="my-citations" className="mt-8">
            <h2 className="text-xl font-bold border-b border-wiki-border-light pb-2 mb-4">
              My Citations
            </h2>

            <SignedOut>
              <p className="text-wiki-text-muted">
                <a href="/sign-in" className="text-wiki-link hover:underline">Sign in</a> to save and organize your citations
                into Lists and Projects.
              </p>
            </SignedOut>

            <SignedIn>
              {isLoadingData ? (
                <p className="text-wiki-text-muted">Loading your citations...</p>
              ) : (
                <div className="space-y-4">
                  {/* Recent Lists */}
                  <div>
                    <h3 className="font-semibold mb-2">Recent Lists</h3>
                    {recentLists.length === 0 ? (
                      <p className="text-wiki-text-muted text-sm">
                        No lists yet.{" "}
                        <a href="/lists" className="text-wiki-link hover:underline">Create your first list</a>
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {recentLists.map((list) => (
                          <li key={list.id}>
                            <a
                              href={`/lists/${list.id}`}
                              className="text-wiki-link hover:underline"
                            >
                              {list.name}
                            </a>
                          </li>
                        ))}
                        {recentLists.length > 0 && (
                          <li>
                            <a
                              href="/lists"
                              className="text-wiki-link hover:underline text-sm"
                            >
                              View all lists &rarr;
                            </a>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* Recent Projects */}
                  <div>
                    <h3 className="font-semibold mb-2">Recent Projects</h3>
                    {recentProjects.length === 0 ? (
                      <p className="text-wiki-text-muted text-sm">
                        No projects yet.{" "}
                        <a href="/projects" className="text-wiki-link hover:underline">Create your first project</a>
                      </p>
                    ) : (
                      <ul className="space-y-1">
                        {recentProjects.map((project) => (
                          <li key={project.id}>
                            <a
                              href={`/projects/${project.id}`}
                              className="text-wiki-link hover:underline"
                            >
                              {project.name}
                            </a>
                          </li>
                        ))}
                        {recentProjects.length > 0 && (
                          <li>
                            <a
                              href="/projects"
                              className="text-wiki-link hover:underline text-sm"
                            >
                              View all projects &rarr;
                            </a>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <WikiButton onClick={() => router.push("/lists")}>
                      My Lists
                    </WikiButton>
                    <WikiButton onClick={() => router.push("/projects")}>
                      My Projects
                    </WikiButton>
                  </div>
                </div>
              )}
            </SignedIn>
          </section>
        </div>
      </div>
    </WikiLayout>
  );
}
