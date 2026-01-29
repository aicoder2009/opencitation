import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "./route";
import { NextRequest } from "next/server";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock database functions
vi.mock("@/lib/db", () => ({
  getProject: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { getProject, updateProject, deleteProject } from "@/lib/db";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockGetProject = getProject as unknown as ReturnType<typeof vi.fn>;
const mockUpdateProject = updateProject as unknown as ReturnType<typeof vi.fn>;
const mockDeleteProject = deleteProject as unknown as ReturnType<typeof vi.fn>;

const createParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("Projects API - /api/projects/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/projects/[id]", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/projects/project-123");
      const response = await GET(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return project when found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetProject.mockResolvedValue({
        id: "project-123",
        name: "My Project",
        description: "Project description",
        userId: "user-123",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      });

      const request = new NextRequest("http://localhost/api/projects/project-123");
      const response = await GET(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("My Project");
      expect(mockGetProject).toHaveBeenCalledWith("user-123", "project-123");
    });

    it("should return 404 if project not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetProject.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/projects/non-existent");
      const response = await GET(request, createParams("non-existent"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Project not found");
    });

    it("should handle database errors", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetProject.mockRejectedValue(new Error("Database error"));

      const request = new NextRequest("http://localhost/api/projects/project-123");
      const response = await GET(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });

  describe("PUT /api/projects/[id]", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/projects/project-123", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated" }),
      });
      const response = await PUT(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("should update project name", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockUpdateProject.mockResolvedValue({
        id: "project-123",
        name: "Updated Name",
        userId: "user-123",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-02",
      });

      const request = new NextRequest("http://localhost/api/projects/project-123", {
        method: "PUT",
        body: JSON.stringify({ name: "Updated Name" }),
      });
      const response = await PUT(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("Updated Name");
      expect(mockUpdateProject).toHaveBeenCalledWith("user-123", "project-123", { name: "Updated Name" });
    });

    it("should update project description", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockUpdateProject.mockResolvedValue({
        id: "project-123",
        name: "Project",
        description: "New description",
        userId: "user-123",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-02",
      });

      const request = new NextRequest("http://localhost/api/projects/project-123", {
        method: "PUT",
        body: JSON.stringify({ description: "New description" }),
      });
      const response = await PUT(request, createParams("project-123"));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockUpdateProject).toHaveBeenCalledWith("user-123", "project-123", { description: "New description" });
    });

    it("should update both name and description", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockUpdateProject.mockResolvedValue({
        id: "project-123",
        name: "New Name",
        description: "New description",
        userId: "user-123",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-02",
      });

      const request = new NextRequest("http://localhost/api/projects/project-123", {
        method: "PUT",
        body: JSON.stringify({ name: "New Name", description: "New description" }),
      });
      const response = await PUT(request, createParams("project-123"));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockUpdateProject).toHaveBeenCalledWith("user-123", "project-123", {
        name: "New Name",
        description: "New description",
      });
    });

    it("should return 400 if no updates provided", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });

      const request = new NextRequest("http://localhost/api/projects/project-123", {
        method: "PUT",
        body: JSON.stringify({}),
      });
      const response = await PUT(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No updates provided");
    });

    it("should return 404 if project not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockUpdateProject.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/projects/non-existent", {
        method: "PUT",
        body: JSON.stringify({ name: "New Name" }),
      });
      const response = await PUT(request, createParams("non-existent"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Project not found");
    });
  });

  describe("DELETE /api/projects/[id]", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/projects/project-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("should delete a project", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetProject.mockResolvedValue({
        id: "project-123",
        name: "To Delete",
        userId: "user-123",
      });
      mockDeleteProject.mockResolvedValue(undefined);

      const request = new NextRequest("http://localhost/api/projects/project-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, createParams("project-123"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Project deleted");
      expect(mockDeleteProject).toHaveBeenCalledWith("user-123", "project-123");
    });

    it("should return 404 if project not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetProject.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/projects/non-existent", {
        method: "DELETE",
      });
      const response = await DELETE(request, createParams("non-existent"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Project not found");
    });
  });
});
