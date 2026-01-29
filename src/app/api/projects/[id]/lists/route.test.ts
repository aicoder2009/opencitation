import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock database functions
vi.mock("@/lib/db", () => ({
  getProject: vi.fn(),
  getProjectLists: vi.fn(),
  createList: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { getProject, getProjectLists, createList } from "@/lib/db";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockGetProject = getProject as unknown as ReturnType<typeof vi.fn>;
const mockGetProjectLists = getProjectLists as unknown as ReturnType<typeof vi.fn>;
const mockCreateList = createList as unknown as ReturnType<typeof vi.fn>;

const createParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("Project Lists API - /api/projects/[id]/lists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/projects/[id]/lists", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/projects/project-123/lists");
      const response = await GET(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 if project not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetProject.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/projects/project-123/lists");
      const response = await GET(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Project not found");
    });

    it("should return lists in project", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetProject.mockResolvedValue({ id: "project-123", name: "Test Project", userId: "user-123" });
      mockGetProjectLists.mockResolvedValue([
        { id: "list-1", name: "Research Notes", projectId: "project-123", userId: "user-123" },
        { id: "list-2", name: "Bibliography", projectId: "project-123", userId: "user-123" },
      ]);

      const request = new NextRequest("http://localhost/api/projects/project-123/lists");
      const response = await GET(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe("Research Notes");
      expect(mockGetProjectLists).toHaveBeenCalledWith("user-123", "project-123");
    });

    it("should return empty array if project has no lists", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetProject.mockResolvedValue({ id: "project-123", name: "Empty Project", userId: "user-123" });
      mockGetProjectLists.mockResolvedValue([]);

      const request = new NextRequest("http://localhost/api/projects/project-123/lists");
      const response = await GET(request, createParams("project-123"));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });
  });

  describe("POST /api/projects/[id]/lists", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/projects/project-123/lists", {
        method: "POST",
        body: JSON.stringify({ name: "New List" }),
      });
      const response = await POST(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("should return 404 if project not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetProject.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/projects/project-123/lists", {
        method: "POST",
        body: JSON.stringify({ name: "New List" }),
      });
      const response = await POST(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Project not found");
    });

    it("should create a list in the project", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetProject.mockResolvedValue({ id: "project-123", name: "Test Project", userId: "user-123" });
      mockCreateList.mockResolvedValue({
        id: "new-list-id",
        name: "New List",
        projectId: "project-123",
        userId: "user-123",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      });

      const request = new NextRequest("http://localhost/api/projects/project-123/lists", {
        method: "POST",
        body: JSON.stringify({ name: "New List" }),
      });
      const response = await POST(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("New List");
      expect(data.data.projectId).toBe("project-123");
      expect(mockCreateList).toHaveBeenCalledWith("user-123", "New List", "project-123");
    });

    it("should return 400 if name is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetProject.mockResolvedValue({ id: "project-123", name: "Test Project", userId: "user-123" });

      const request = new NextRequest("http://localhost/api/projects/project-123/lists", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const response = await POST(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("List name is required");
    });

    it("should return 400 if name is empty", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetProject.mockResolvedValue({ id: "project-123", name: "Test Project", userId: "user-123" });

      const request = new NextRequest("http://localhost/api/projects/project-123/lists", {
        method: "POST",
        body: JSON.stringify({ name: "   " }),
      });
      const response = await POST(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("List name is required");
    });
  });
});
