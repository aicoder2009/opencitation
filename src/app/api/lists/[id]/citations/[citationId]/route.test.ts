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
  getCitation: vi.fn(),
  updateCitation: vi.fn(),
  deleteCitation: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { getList, getCitation, updateCitation, deleteCitation } from "@/lib/db";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockGetList = getList as unknown as ReturnType<typeof vi.fn>;
const mockGetCitation = getCitation as unknown as ReturnType<typeof vi.fn>;
const mockUpdateCitation = updateCitation as unknown as ReturnType<typeof vi.fn>;
const mockDeleteCitation = deleteCitation as unknown as ReturnType<typeof vi.fn>;

const createParams = (id: string, citationId: string) => ({
  params: Promise.resolve({ id, citationId }),
});

const sampleCitation = {
  id: "citation-123",
  listId: "list-123",
  style: "apa",
  fields: {
    sourceType: "website",
    accessType: "web",
    title: "Sample Article",
    url: "https://example.com",
  },
  formattedText: "Doe, J. (2024). Sample Article.",
  formattedHtml: "<p>Doe, J. (2024). <em>Sample Article</em>.</p>",
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
};

describe("Citation API - /api/lists/[id]/citations/[citationId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/lists/[id]/citations/[citationId]", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/lists/list-123/citations/citation-123");
      const response = await GET(request, createParams("list-123", "citation-123"));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("should return 404 if list not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/lists/list-123/citations/citation-123");
      const response = await GET(request, createParams("list-123", "citation-123"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("List not found");
    });

    it("should return 404 if citation not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({ id: "list-123", userId: "user-123" });
      mockGetCitation.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/lists/list-123/citations/non-existent");
      const response = await GET(request, createParams("list-123", "non-existent"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Citation not found");
    });

    it("should return citation when found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({ id: "list-123", userId: "user-123" });
      mockGetCitation.mockResolvedValue(sampleCitation);

      const request = new NextRequest("http://localhost/api/lists/list-123/citations/citation-123");
      const response = await GET(request, createParams("list-123", "citation-123"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("citation-123");
      expect(data.data.style).toBe("apa");
    });
  });

  describe("PUT /api/lists/[id]/citations/[citationId]", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/lists/list-123/citations/citation-123", {
        method: "PUT",
        body: JSON.stringify({ style: "mla" }),
      });
      const response = await PUT(request, createParams("list-123", "citation-123"));
      const data = await response.json();

      expect(response.status).toBe(401);
    });

    it("should return 404 if list not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/lists/list-123/citations/citation-123", {
        method: "PUT",
        body: JSON.stringify({ style: "mla" }),
      });
      const response = await PUT(request, createParams("list-123", "citation-123"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("List not found");
    });

    it("should return 400 if no updates provided", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({ id: "list-123", userId: "user-123" });

      const request = new NextRequest("http://localhost/api/lists/list-123/citations/citation-123", {
        method: "PUT",
        body: JSON.stringify({}),
      });
      const response = await PUT(request, createParams("list-123", "citation-123"));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("No updates provided");
    });

    it("should update citation style", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({ id: "list-123", userId: "user-123" });
      mockUpdateCitation.mockResolvedValue({
        ...sampleCitation,
        style: "mla",
        formattedText: "Updated MLA",
        updatedAt: "2024-01-02",
      });

      const request = new NextRequest("http://localhost/api/lists/list-123/citations/citation-123", {
        method: "PUT",
        body: JSON.stringify({ style: "mla", formattedText: "Updated MLA" }),
      });
      const response = await PUT(request, createParams("list-123", "citation-123"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.style).toBe("mla");
      expect(mockUpdateCitation).toHaveBeenCalledWith("list-123", "citation-123", {
        fields: undefined,
        style: "mla",
        formattedText: "Updated MLA",
        formattedHtml: undefined,
      });
    });

    it("should return 404 if citation not found on update", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({ id: "list-123", userId: "user-123" });
      mockUpdateCitation.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/lists/list-123/citations/non-existent", {
        method: "PUT",
        body: JSON.stringify({ style: "mla" }),
      });
      const response = await PUT(request, createParams("list-123", "non-existent"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Citation not found");
    });
  });

  describe("DELETE /api/lists/[id]/citations/[citationId]", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/lists/list-123/citations/citation-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, createParams("list-123", "citation-123"));
      const data = await response.json();

      expect(response.status).toBe(401);
    });

    it("should return 404 if list not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/lists/list-123/citations/citation-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, createParams("list-123", "citation-123"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("List not found");
    });

    it("should return 404 if citation not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({ id: "list-123", userId: "user-123" });
      mockGetCitation.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/lists/list-123/citations/non-existent", {
        method: "DELETE",
      });
      const response = await DELETE(request, createParams("list-123", "non-existent"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Citation not found");
    });

    it("should delete citation", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({ id: "list-123", userId: "user-123" });
      mockGetCitation.mockResolvedValue(sampleCitation);
      mockDeleteCitation.mockResolvedValue(undefined);

      const request = new NextRequest("http://localhost/api/lists/list-123/citations/citation-123", {
        method: "DELETE",
      });
      const response = await DELETE(request, createParams("list-123", "citation-123"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe("Citation deleted");
      expect(mockDeleteCitation).toHaveBeenCalledWith("list-123", "citation-123");
    });
  });
});
