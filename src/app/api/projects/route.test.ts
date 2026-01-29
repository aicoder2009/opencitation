import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock database functions
vi.mock("@/lib/db", () => ({
  createProject: vi.fn(),
  getUserProjects: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { createProject, getUserProjects } from "@/lib/db";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockCreateProject = createProject as unknown as ReturnType<typeof vi.fn>;
const mockGetUserProjects = getUserProjects as unknown as ReturnType<typeof vi.fn>;

describe("Projects API - /api/projects", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/projects", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return user projects when authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetUserProjects.mockResolvedValue([
        { id: "project-1", name: "Research Project", userId: "user-123", createdAt: "2024-01-01" },
        { id: "project-2", name: "Thesis", userId: "user-123", createdAt: "2024-01-02" },
      ]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].name).toBe("Research Project");
    });

    it("should return empty array when user has no projects", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetUserProjects.mockResolvedValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });

    it("should handle database errors gracefully", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetUserProjects.mockRejectedValue(new Error("Database error"));

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Failed to fetch projects");
    });
  });

  describe("POST /api/projects", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "New Project" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("should create a new project", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockCreateProject.mockResolvedValue({
        id: "new-project-id",
        name: "New Project",
        userId: "user-123",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      });

      const request = new NextRequest("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "New Project" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe("New Project");
      expect(mockCreateProject).toHaveBeenCalledWith("user-123", "New Project", undefined);
    });

    it("should create a project with description", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockCreateProject.mockResolvedValue({
        id: "new-project-id",
        name: "Research Project",
        description: "A detailed research project",
        userId: "user-123",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      });

      const request = new NextRequest("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Research Project", description: "A detailed research project" }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(mockCreateProject).toHaveBeenCalledWith("user-123", "Research Project", "A detailed research project");
    });

    it("should return 400 if name is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });

      const request = new NextRequest("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({}),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Project name is required");
    });

    it("should return 400 if name is empty string", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });

      const request = new NextRequest("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "   " }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it("should trim whitespace from name and description", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockCreateProject.mockResolvedValue({
        id: "new-project-id",
        name: "Trimmed Name",
        description: "Trimmed description",
        userId: "user-123",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      });

      const request = new NextRequest("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "  Trimmed Name  ", description: "  Trimmed description  " }),
      });

      await POST(request);

      expect(mockCreateProject).toHaveBeenCalledWith("user-123", "Trimmed Name", "Trimmed description");
    });
  });
});
