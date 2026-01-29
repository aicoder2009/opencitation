import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, DELETE } from "./route";
import { NextRequest } from "next/server";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock database functions
vi.mock("@/lib/db", () => ({
  getShareLink: vi.fn(),
  deleteShareLink: vi.fn(),
  getListCitations: vi.fn(),
  findListById: vi.fn(),
  findProjectById: vi.fn(),
  getUserLists: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import {
  getShareLink,
  deleteShareLink,
  getListCitations,
  findListById,
  findProjectById,
  getUserLists,
} from "@/lib/db";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockGetShareLink = getShareLink as unknown as ReturnType<typeof vi.fn>;
const mockDeleteShareLink = deleteShareLink as unknown as ReturnType<typeof vi.fn>;
const mockGetListCitations = getListCitations as unknown as ReturnType<typeof vi.fn>;
const mockFindListById = findListById as unknown as ReturnType<typeof vi.fn>;
const mockFindProjectById = findProjectById as unknown as ReturnType<typeof vi.fn>;
const mockGetUserLists = getUserLists as unknown as ReturnType<typeof vi.fn>;

const createParams = (code: string) => ({ params: Promise.resolve({ code }) });

describe("Share Code API - /api/share/[code]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/share/[code]", () => {
    it("should return 404 if share link not found", async () => {
      mockGetShareLink.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/share/invalid-code");
      const response = await GET(request, createParams("invalid-code"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Share link not found or expired");
    });

    it("should return shared list with citations", async () => {
      mockGetShareLink.mockResolvedValue({
        code: "abc123",
        type: "list",
        targetId: "list-123",
        createdAt: "2024-01-01",
      });
      mockFindListById.mockResolvedValue({
        id: "list-123",
        name: "Shared List",
        userId: "user-123",
      });
      mockGetListCitations.mockResolvedValue([
        {
          id: "citation-1",
          style: "apa",
          formattedText: "Citation 1 text",
          formattedHtml: "<p>Citation 1</p>",
          createdAt: "2024-01-01",
        },
        {
          id: "citation-2",
          style: "mla",
          formattedText: "Citation 2 text",
          formattedHtml: "<p>Citation 2</p>",
          createdAt: "2024-01-02",
        },
      ]);

      const request = new NextRequest("http://localhost/api/share/abc123");
      const response = await GET(request, createParams("abc123"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.type).toBe("list");
      expect(data.data.name).toBe("Shared List");
      expect(data.data.citations).toHaveLength(2);
    });

    it("should return list with 'Shared List' name if list not found", async () => {
      mockGetShareLink.mockResolvedValue({
        code: "abc123",
        type: "list",
        targetId: "list-123",
        createdAt: "2024-01-01",
      });
      mockFindListById.mockResolvedValue(null);
      mockGetListCitations.mockResolvedValue([
        {
          id: "citation-1",
          style: "apa",
          formattedText: "Citation text",
          formattedHtml: "<p>Citation</p>",
          createdAt: "2024-01-01",
        },
      ]);

      const request = new NextRequest("http://localhost/api/share/abc123");
      const response = await GET(request, createParams("abc123"));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.name).toBe("Shared List");
      expect(data.data.citations).toHaveLength(1);
    });

    it("should return shared project with lists and citations", async () => {
      mockGetShareLink.mockResolvedValue({
        code: "xyz789",
        type: "project",
        targetId: "project-123",
        createdAt: "2024-01-01",
      });
      mockFindProjectById.mockResolvedValue({
        id: "project-123",
        name: "Shared Project",
        description: "A shared project",
        userId: "user-123",
      });
      mockGetUserLists.mockResolvedValue([
        { id: "list-1", name: "List 1", projectId: "project-123", userId: "user-123" },
        { id: "list-2", name: "List 2", projectId: "project-123", userId: "user-123" },
        { id: "list-3", name: "Other List", projectId: "other-project", userId: "user-123" },
      ]);
      mockGetListCitations.mockResolvedValue([]);

      const request = new NextRequest("http://localhost/api/share/xyz789");
      const response = await GET(request, createParams("xyz789"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.type).toBe("project");
      expect(data.data.name).toBe("Shared Project");
      expect(data.data.description).toBe("A shared project");
      expect(data.data.lists).toHaveLength(2); // Only lists in this project
    });

    it("should return project with 'Shared Project' name if project not found", async () => {
      mockGetShareLink.mockResolvedValue({
        code: "xyz789",
        type: "project",
        targetId: "project-123",
        createdAt: "2024-01-01",
      });
      mockFindProjectById.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/share/xyz789");
      const response = await GET(request, createParams("xyz789"));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.name).toBe("Shared Project");
      expect(data.data.lists).toEqual([]);
    });

    it("should handle database errors", async () => {
      mockGetShareLink.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost/api/share/abc123");
      const response = await GET(request, createParams("abc123"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch shared content");
    });
  });

  describe("DELETE /api/share/[code]", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/share/abc123", {
        method: "DELETE",
      });
      const response = await DELETE(request, createParams("abc123"));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 if share link not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetShareLink.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/share/invalid-code", {
        method: "DELETE",
      });
      const response = await DELETE(request, createParams("invalid-code"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Share link not found");
    });

    it("should delete share link", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetShareLink.mockResolvedValue({
        code: "abc123",
        type: "list",
        targetId: "list-123",
      });
      mockDeleteShareLink.mockResolvedValue(undefined);

      const request = new NextRequest("http://localhost/api/share/abc123", {
        method: "DELETE",
      });
      const response = await DELETE(request, createParams("abc123"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Share link revoked");
      expect(mockDeleteShareLink).toHaveBeenCalledWith("abc123");
    });

    it("should handle database errors", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetShareLink.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost/api/share/abc123", {
        method: "DELETE",
      });
      const response = await DELETE(request, createParams("abc123"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to revoke share link");
    });
  });
});
