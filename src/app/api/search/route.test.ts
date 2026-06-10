import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";
import { NextRequest } from "next/server";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  getUserLists: vi.fn(),
  getUserProjects: vi.fn(),
  getListCitations: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { getUserLists, getUserProjects, getListCitations } from "@/lib/db";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockGetUserLists = getUserLists as unknown as ReturnType<typeof vi.fn>;
const mockGetUserProjects = getUserProjects as unknown as ReturnType<typeof vi.fn>;
const mockGetListCitations = getListCitations as unknown as ReturnType<typeof vi.fn>;

function makeRequest(q?: string) {
  const url = q !== undefined
    ? `http://localhost/api/search?q=${encodeURIComponent(q)}`
    : "http://localhost/api/search";
  return new NextRequest(url);
}

const LISTS = [
  { id: "list-1", name: "Climate Research", userId: "user-123", createdAt: "2024-01-01", updatedAt: "2024-01-01" },
  { id: "list-2", name: "History Essay", description: "Sources on climate treaties", userId: "user-123", createdAt: "2024-01-02", updatedAt: "2024-01-02" },
];

const PROJECTS = [
  { id: "project-1", name: "Thesis", description: "Climate change chapter", userId: "user-123", createdAt: "2024-01-01", updatedAt: "2024-01-01" },
];

const CITATIONS_LIST_1 = [
  {
    id: "cit-1",
    listId: "list-1",
    fields: { sourceType: "journal", accessType: "web", title: "Warming Trends", authors: [{ lastName: "Hansen", firstName: "James" }], journalTitle: "Science" },
    style: "apa",
    formattedText: "Hansen, J. (2023). Warming Trends. Science.",
    formattedHtml: "",
    tags: ["climate"],
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
  {
    id: "cit-2",
    listId: "list-1",
    fields: { sourceType: "book", accessType: "print", title: "Unrelated Book" },
    style: "apa",
    formattedText: "Unrelated Book.",
    formattedHtml: "",
    createdAt: "2024-01-01",
    updatedAt: "2024-01-01",
  },
];

describe("Search API - /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 if not authenticated", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    const response = await GET(makeRequest("climate"));
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
  });

  it("returns 400 for queries shorter than 2 characters", async () => {
    mockAuth.mockResolvedValue({ userId: "user-123" });

    for (const q of [undefined, "", "a", " x "]) {
      const response = await GET(makeRequest(q));
      expect(response.status).toBe(400);
    }
  });

  it("matches projects, lists, and citations case-insensitively", async () => {
    mockAuth.mockResolvedValue({ userId: "user-123" });
    mockGetUserLists.mockResolvedValue(LISTS);
    mockGetUserProjects.mockResolvedValue(PROJECTS);
    mockGetListCitations.mockImplementation((listId: string) =>
      Promise.resolve(listId === "list-1" ? CITATIONS_LIST_1 : [])
    );

    const response = await GET(makeRequest("CLIMATE"));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    // "Climate" in project description, list-1 name, list-2 description.
    expect(data.data.projects.map((p: { id: string }) => p.id)).toEqual(["project-1"]);
    expect(data.data.lists.map((l: { id: string }) => l.id)).toEqual(["list-1", "list-2"]);
    // cit-1 matches via tag "climate"; cit-2 doesn't match.
    expect(data.data.citations).toHaveLength(1);
    expect(data.data.citations[0]).toMatchObject({
      id: "cit-1",
      listId: "list-1",
      listName: "Climate Research",
      title: "Warming Trends",
    });
  });

  it("matches citations by author name", async () => {
    mockAuth.mockResolvedValue({ userId: "user-123" });
    mockGetUserLists.mockResolvedValue(LISTS);
    mockGetUserProjects.mockResolvedValue([]);
    mockGetListCitations.mockImplementation((listId: string) =>
      Promise.resolve(listId === "list-1" ? CITATIONS_LIST_1 : [])
    );

    const response = await GET(makeRequest("hansen"));
    const data = await response.json();

    expect(data.data.citations).toHaveLength(1);
    expect(data.data.citations[0].id).toBe("cit-1");
    expect(data.data.projects).toEqual([]);
    expect(data.data.lists).toEqual([]);
  });

  it("returns empty groups when nothing matches", async () => {
    mockAuth.mockResolvedValue({ userId: "user-123" });
    mockGetUserLists.mockResolvedValue(LISTS);
    mockGetUserProjects.mockResolvedValue(PROJECTS);
    mockGetListCitations.mockResolvedValue([]);

    const response = await GET(makeRequest("zzzz"));
    const data = await response.json();

    expect(data.data.projects).toEqual([]);
    expect(data.data.lists).toEqual([]);
    expect(data.data.citations).toEqual([]);
  });

  it("handles database errors gracefully", async () => {
    mockAuth.mockResolvedValue({ userId: "user-123" });
    mockGetUserLists.mockRejectedValue(new Error("boom"));
    mockGetUserProjects.mockResolvedValue([]);

    const response = await GET(makeRequest("climate"));
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
  });
});
