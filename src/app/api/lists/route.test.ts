import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock database functions
vi.mock("@/lib/db", () => ({
  createList: vi.fn(),
  getUserLists: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { createList, getUserLists } from "@/lib/db";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockCreateList = createList as unknown as ReturnType<typeof vi.fn>;
const mockGetUserLists = getUserLists as unknown as ReturnType<typeof vi.fn>;

describe("Lists API - /api/lists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/lists", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return user lists when authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetUserLists.mockResolvedValue([
        { id: "list-1", name: "Research", userId: "user-123", createdAt: "2024-01-01" },
        { id: "list-2", name: "Essays", userId: "user-123", createdAt: "2024-01-02" },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe("Research");
    });

    it("should return empty array when user has no lists", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetUserLists.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it("should handle database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetUserLists.mockRejectedValue(new Error("Database error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch lists");
    });
  });

  describe("POST /api/lists", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({ name: "New List" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("should create a new list", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockCreateList.mockResolvedValue({
        id: "new-list-id",
        name: "New List",
        userId: "user-123",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      });

      const request = new NextRequest("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({ name: "New List" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("New List");
      expect(mockCreateList).toHaveBeenCalledWith("user-123", "New List", undefined);
    });

    it("should create a list with projectId", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockCreateList.mockResolvedValue({
        id: "new-list-id",
        name: "Project List",
        userId: "user-123",
        projectId: "project-123",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      });

      const request = new NextRequest("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({ name: "Project List", projectId: "project-123" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockCreateList).toHaveBeenCalledWith("user-123", "Project List", "project-123");
    });

    it("should return 400 if name is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });

      const request = new NextRequest("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Name is required");
    });

    it("should return 400 if name is empty string", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });

      const request = new NextRequest("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({ name: "   " }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("should trim whitespace from name", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockCreateList.mockResolvedValue({
        id: "new-list-id",
        name: "Trimmed Name",
        userId: "user-123",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      });

      const request = new NextRequest("http://localhost/api/lists", {
        method: "POST",
        body: JSON.stringify({ name: "  Trimmed Name  " }),
      });

      await POST(request);

      expect(mockCreateList).toHaveBeenCalledWith("user-123", "Trimmed Name", undefined);
    });
  });
});
