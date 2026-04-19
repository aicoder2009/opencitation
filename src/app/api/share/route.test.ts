import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock database functions
vi.mock("@/lib/db", () => ({
  createShareLink: vi.fn(),
  getList: vi.fn(),
  getProject: vi.fn(),
  getUserLists: vi.fn(),
  getUserProjects: vi.fn(),
  listUserShares: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import {
  createShareLink,
  getList,
  getProject,
  getUserLists,
  getUserProjects,
  listUserShares,
} from "@/lib/db";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockCreateShareLink = createShareLink as unknown as ReturnType<typeof vi.fn>;
const mockGetList = getList as unknown as ReturnType<typeof vi.fn>;
const mockGetProject = getProject as unknown as ReturnType<typeof vi.fn>;
const mockGetUserLists = getUserLists as unknown as ReturnType<typeof vi.fn>;
const mockGetUserProjects = getUserProjects as unknown as ReturnType<typeof vi.fn>;
const mockListUserShares = listUserShares as unknown as ReturnType<typeof vi.fn>;

describe("Share API - /api/share", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /api/share", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/share", {
        method: "POST",
        body: JSON.stringify({ type: "list", targetId: "list-123" }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 400 if type is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });

      const request = new NextRequest("http://localhost/api/share", {
        method: "POST",
        body: JSON.stringify({ targetId: "list-123" }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Type and targetId are required");
    });

    it("should return 400 if targetId is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });

      const request = new NextRequest("http://localhost/api/share", {
        method: "POST",
        body: JSON.stringify({ type: "list" }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Type and targetId are required");
    });

    it("should return 400 if type is invalid", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });

      const request = new NextRequest("http://localhost/api/share", {
        method: "POST",
        body: JSON.stringify({ type: "invalid", targetId: "test-123" }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Type must be 'list' or 'project'");
    });

    it("should return 404 if list not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/share", {
        method: "POST",
        body: JSON.stringify({ type: "list", targetId: "non-existent" }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("List not found");
    });

    it("should return 404 if project not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetProject.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/share", {
        method: "POST",
        body: JSON.stringify({ type: "project", targetId: "non-existent" }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Project not found");
    });

    it("should create share link for list", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({ id: "list-123", name: "My List", userId: "user-123" });
      mockCreateShareLink.mockResolvedValue({
        code: "abc123xy",
        type: "list",
        targetId: "list-123",
        createdAt: "2024-01-01",
      });

      const request = new NextRequest("http://localhost/api/share", {
        method: "POST",
        body: JSON.stringify({ type: "list", targetId: "list-123" }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.code).toBe("abc123xy");
      expect(data.data.type).toBe("list");
      expect(data.data.url).toContain("/share/abc123xy");
      expect(mockCreateShareLink).toHaveBeenCalledWith("user-123", "list", "list-123", undefined);
    });

    it("should create share link for project", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetProject.mockResolvedValue({ id: "project-123", name: "My Project", userId: "user-123" });
      mockCreateShareLink.mockResolvedValue({
        code: "xyz789ab",
        type: "project",
        targetId: "project-123",
        createdAt: "2024-01-01",
      });

      const request = new NextRequest("http://localhost/api/share", {
        method: "POST",
        body: JSON.stringify({ type: "project", targetId: "project-123" }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.code).toBe("xyz789ab");
      expect(data.data.type).toBe("project");
      expect(mockCreateShareLink).toHaveBeenCalledWith("user-123", "project", "project-123", undefined);
    });

    it("should create share link with expiry", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({ id: "list-123", name: "My List", userId: "user-123" });
      mockCreateShareLink.mockResolvedValue({
        code: "abc123xy",
        type: "list",
        targetId: "list-123",
        createdAt: "2024-01-01",
        expiresAt: "2024-01-08",
      });

      const request = new NextRequest("http://localhost/api/share", {
        method: "POST",
        body: JSON.stringify({ type: "list", targetId: "list-123", expiresInDays: 7 }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.expiresAt).toBe("2024-01-08");
      expect(mockCreateShareLink).toHaveBeenCalledWith("user-123", "list", "list-123", 7);
    });

    it("should handle database errors", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost/api/share", {
        method: "POST",
        body: JSON.stringify({ type: "list", targetId: "list-123" }),
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to create share link");
    });
  });

  describe("GET /api/share", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("should return enriched list of user's shares", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockListUserShares.mockResolvedValue([
        {
          code: "aaaa",
          userId: "user-123",
          type: "list",
          targetId: "list-1",
          createdAt: "2026-01-01T00:00:00Z",
        },
        {
          code: "bbbb",
          userId: "user-123",
          type: "project",
          targetId: "proj-1",
          createdAt: "2026-01-02T00:00:00Z",
          expiresAt: "2026-02-01T00:00:00Z",
        },
      ]);
      mockGetUserLists.mockResolvedValue([
        { id: "list-1", name: "My List", userId: "user-123" },
      ]);
      mockGetUserProjects.mockResolvedValue([
        { id: "proj-1", name: "My Project", userId: "user-123" },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].targetName).toBe("My List");
      expect(data.data[1].targetName).toBe("My Project");
      expect(data.data[0].url).toContain("/share/aaaa");
    });

    it("should null out targetName for orphaned shares", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockListUserShares.mockResolvedValue([
        {
          code: "zzzz",
          userId: "user-123",
          type: "list",
          targetId: "missing",
          createdAt: "2026-01-01T00:00:00Z",
        },
      ]);
      mockGetUserLists.mockResolvedValue([]);
      mockGetUserProjects.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(data.data[0].targetName).toBeNull();
    });
  });
});
