import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "./route";
import { NextRequest } from "next/server";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock database functions
vi.mock("@/lib/db", () => ({
  getList: vi.fn(),
  updateList: vi.fn(),
  deleteList: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { getList, updateList, deleteList } from "@/lib/db";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockGetList = getList as unknown as ReturnType<typeof vi.fn>;
const mockUpdateList = updateList as unknown as ReturnType<typeof vi.fn>;
const mockDeleteList = deleteList as unknown as ReturnType<typeof vi.fn>;

const createParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("Lists API - /api/lists/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/lists/[id]", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/lists/list-123");
      const response = await GET(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return list when found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({
        id: "list-123",
        name: "My List",
        userId: "user-123",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      });

      const request = new NextRequest("http://localhost/api/lists/list-123");
      const response = await GET(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("My List");
      expect(mockGetList).toHaveBeenCalledWith("user-123", "list-123");
    });

    it("should return 404 if list not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/lists/non-existent");
      const response = await GET(request, createParams("non-existent"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("List not found");
    });

    it("should handle database errors", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost/api/lists/list-123");
      const response = await GET(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe("PUT /api/lists/[id]", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/lists/list-123", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
      });
      const response = await PUT(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("should update list name", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockUpdateList.mockResolvedValue({
        id: "list-123",
        name: "Updated Name",
        userId: "user-123",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-02",
      });

      const request = new NextRequest("http://localhost/api/lists/list-123", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Name" }),
      });
      const response = await PUT(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("Updated Name");
      expect(mockUpdateList).toHaveBeenCalledWith("user-123", "list-123", { name: "Updated Name" });
    });

    it("should update list projectId", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockUpdateList.mockResolvedValue({
        id: "list-123",
        name: "List",
        userId: "user-123",
        projectId: "project-456",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-02",
      });

      const request = new NextRequest("http://localhost/api/lists/list-123", {
        method: "PUT",
        body: JSON.stringify({ projectId: "project-456" }),
      });
      const response = await PUT(request, createParams("list-123"));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockUpdateList).toHaveBeenCalledWith("user-123", "list-123", { projectId: "project-456" });
    });

    it("should return 400 if no updates provided", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });

      const request = new NextRequest("http://localhost/api/lists/list-123", {
        method: "PUT",
        body: JSON.stringify({}),
      });
      const response = await PUT(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No updates provided");
    });

    it("should return 400 if name is empty string", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });

      const request = new NextRequest("http://localhost/api/lists/list-123", {
        method: "PUT",
        body: JSON.stringify({ name: "" }),
      });
      const response = await PUT(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid name");
    });

    it("should return 404 if list not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockUpdateList.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/lists/non-existent", {
        method: "PUT",
        body: JSON.stringify({ name: "New Name" }),
      });
      const response = await PUT(request, createParams("non-existent"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("List not found");
    });
  });

  describe("DELETE /api/lists/[id]", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/lists/list-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("should delete a list", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({
        id: "list-123",
        name: "To Delete",
        userId: "user-123",
      });
      mockDeleteList.mockResolvedValue(undefined);

      const request = new NextRequest("http://localhost/api/lists/list-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("List deleted");
      expect(mockDeleteList).toHaveBeenCalledWith("user-123", "list-123");
    });

    it("should return 404 if list not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/lists/non-existent", {
        method: "DELETE",
      });
      const response = await DELETE(request, createParams("non-existent"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("List not found");
    });
  });
});
