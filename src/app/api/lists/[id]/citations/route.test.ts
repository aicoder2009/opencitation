import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";
import { NextRequest } from "next/server";

// Mock Clerk auth
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

// Mock database functions
vi.mock("@/lib/db", () => ({
  getList: vi.fn(),
  getListCitations: vi.fn(),
  addCitation: vi.fn(),
}));

import { auth } from "@clerk/nextjs/server";
import { getList, getListCitations, addCitation } from "@/lib/db";

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockGetList = getList as unknown as ReturnType<typeof vi.fn>;
const mockGetListCitations = getListCitations as unknown as ReturnType<typeof vi.fn>;
const mockAddCitation = addCitation as unknown as ReturnType<typeof vi.fn>;

const createParams = (id: string) => ({ params: Promise.resolve({ id }) });

const sampleCitationFields = {
  sourceType: "website",
  accessType: "web",
  title: "Sample Article",
  url: "https://example.com",
  authors: [{ firstName: "John", lastName: "Doe" }],
  publicationDate: { year: 2024 },
};

describe("Citations API - /api/lists/[id]/citations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/lists/[id]/citations", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/lists/list-123/citations");
      const response = await GET(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe("Unauthorized");
    });

    it("should return 404 if list not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/lists/list-123/citations");
      const response = await GET(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("List not found");
    });

    it("should return citations for a list", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({ id: "list-123", name: "Test List", userId: "user-123" });
      mockGetListCitations.mockResolvedValue([
        {
          id: "citation-1",
          listId: "list-123",
          style: "apa",
          formattedText: "Doe, J. (2024). Article.",
          formattedHtml: "<p>Doe, J. (2024). Article.</p>",
          fields: sampleCitationFields,
        },
        {
          id: "citation-2",
          listId: "list-123",
          style: "mla",
          formattedText: "Doe, John. \"Article.\"",
          formattedHtml: "<p>Doe, John. \"Article.\"</p>",
          fields: sampleCitationFields,
        },
      ]);

      const request = new NextRequest("http://localhost/api/lists/list-123/citations");
      const response = await GET(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.data[0].style).toBe("apa");
    });

    it("should return empty array if list has no citations", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({ id: "list-123", name: "Empty List", userId: "user-123" });
      mockGetListCitations.mockResolvedValue([]);

      const request = new NextRequest("http://localhost/api/lists/list-123/citations");
      const response = await GET(request, createParams("list-123"));
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toEqual([]);
    });
  });

  describe("POST /api/lists/[id]/citations", () => {
    it("should return 401 if not authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: null });

      const request = new NextRequest("http://localhost/api/lists/list-123/citations", {
        method: "POST",
        body: JSON.stringify({
          fields: sampleCitationFields,
          style: "apa",
          formattedText: "text",
          formattedHtml: "<p>html</p>",
        }),
      });
      const response = await POST(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it("should return 404 if list not found", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue(null);

      const request = new NextRequest("http://localhost/api/lists/list-123/citations", {
        method: "POST",
        body: JSON.stringify({
          fields: sampleCitationFields,
          style: "apa",
          formattedText: "text",
          formattedHtml: "<p>html</p>",
        }),
      });
      const response = await POST(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("List not found");
    });

    it("should add a citation to the list", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({ id: "list-123", name: "Test List", userId: "user-123" });
      mockAddCitation.mockResolvedValue({
        id: "citation-new",
        listId: "list-123",
        style: "apa",
        fields: sampleCitationFields,
        formattedText: "Doe, J. (2024). Sample Article.",
        formattedHtml: "<p>Doe, J. (2024). <em>Sample Article</em>.</p>",
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      });

      const request = new NextRequest("http://localhost/api/lists/list-123/citations", {
        method: "POST",
        body: JSON.stringify({
          fields: sampleCitationFields,
          style: "apa",
          formattedText: "Doe, J. (2024). Sample Article.",
          formattedHtml: "<p>Doe, J. (2024). <em>Sample Article</em>.</p>",
        }),
      });
      const response = await POST(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe("citation-new");
      expect(mockAddCitation).toHaveBeenCalledWith(
        "list-123",
        sampleCitationFields,
        "apa",
        "Doe, J. (2024). Sample Article.",
        "<p>Doe, J. (2024). <em>Sample Article</em>.</p>"
      );
    });

    it("should return 400 if fields are missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({ id: "list-123", name: "Test List", userId: "user-123" });

      const request = new NextRequest("http://localhost/api/lists/list-123/citations", {
        method: "POST",
        body: JSON.stringify({
          style: "apa",
          formattedText: "text",
          // Missing fields and formattedHtml
        }),
      });
      const response = await POST(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields");
    });

    it("should return 400 if style is missing", async () => {
      mockAuth.mockResolvedValue({ userId: "user-123" });
      mockGetList.mockResolvedValue({ id: "list-123", name: "Test List", userId: "user-123" });

      const request = new NextRequest("http://localhost/api/lists/list-123/citations", {
        method: "POST",
        body: JSON.stringify({
          fields: sampleCitationFields,
          formattedText: "text",
          formattedHtml: "<p>html</p>",
          // Missing style
        }),
      });
      const response = await POST(request, createParams("list-123"));
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing required fields");
    });
  });
});
