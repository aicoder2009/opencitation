import { describe, it, expect, beforeEach } from "vitest";
import {
  // Lists
  createList,
  getList,
  getUserLists,
  updateList,
  deleteList,
  findListById,
  // Projects
  createProject,
  getProject,
  getUserProjects,
  updateProject,
  deleteProject,
  getProjectLists,
  findProjectById,
  // Citations
  addCitation,
  getCitation,
  getListCitations,
  updateCitation,
  deleteCitation,
  // Share Links
  createShareLink,
  getShareLink,
  deleteShareLink,
} from "./local-store";
import type { CitationFields, CitationStyle } from "@/types";

// Helper to create sample citation fields
const createSampleCitationFields = (): CitationFields => ({
  sourceType: "website",
  accessType: "web",
  title: "Sample Article",
  url: "https://example.com/article",
  authors: [{ firstName: "John", lastName: "Doe" }],
  publicationDate: { year: 2024, month: 1, day: 15 },
});

describe("Local Store - Lists", () => {
  const testUserId = "test-user-" + Date.now();

  describe("createList", () => {
    it("should create a new list with required fields", async () => {
      const list = await createList(testUserId, "My Research List");

      expect(list).toBeDefined();
      expect(list.id).toBeDefined();
      expect(list.userId).toBe(testUserId);
      expect(list.name).toBe("My Research List");
      expect(list.createdAt).toBeDefined();
      expect(list.updatedAt).toBeDefined();
    });

    it("should create a list with projectId", async () => {
      const project = await createProject(testUserId, "Test Project");
      const list = await createList(testUserId, "Project List", project.id);

      expect(list.projectId).toBe(project.id);
    });

    it("should generate unique IDs for each list", async () => {
      const list1 = await createList(testUserId, "List 1");
      const list2 = await createList(testUserId, "List 2");

      expect(list1.id).not.toBe(list2.id);
    });
  });

  describe("getList", () => {
    it("should retrieve an existing list", async () => {
      const created = await createList(testUserId, "Retrievable List");
      const retrieved = await getList(testUserId, created.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe("Retrievable List");
    });

    it("should return null for non-existent list", async () => {
      const result = await getList(testUserId, "non-existent-id");
      expect(result).toBeNull();
    });

    it("should return null for wrong userId", async () => {
      const created = await createList(testUserId, "User Specific List");
      const result = await getList("different-user", created.id);
      expect(result).toBeNull();
    });
  });

  describe("getUserLists", () => {
    it("should return all lists for a user", async () => {
      const uniqueUserId = "list-user-" + Date.now();
      await createList(uniqueUserId, "List A");
      await createList(uniqueUserId, "List B");
      await createList(uniqueUserId, "List C");

      const lists = await getUserLists(uniqueUserId);

      expect(lists.length).toBeGreaterThanOrEqual(3);
      expect(lists.some(l => l.name === "List A")).toBe(true);
      expect(lists.some(l => l.name === "List B")).toBe(true);
      expect(lists.some(l => l.name === "List C")).toBe(true);
    });

    it("should return empty array for user with no lists", async () => {
      const lists = await getUserLists("user-with-no-lists-" + Date.now());
      expect(lists).toEqual([]);
    });

    it("should sort lists by creation date (newest first)", async () => {
      const uniqueUserId = "sort-user-" + Date.now();
      await createList(uniqueUserId, "First");
      await new Promise(r => setTimeout(r, 10));
      await createList(uniqueUserId, "Second");
      await new Promise(r => setTimeout(r, 10));
      await createList(uniqueUserId, "Third");

      const lists = await getUserLists(uniqueUserId);

      expect(lists[0].name).toBe("Third");
      expect(lists[1].name).toBe("Second");
      expect(lists[2].name).toBe("First");
    });
  });

  describe("updateList", () => {
    it("should update list name", async () => {
      const list = await createList(testUserId, "Original Name");
      await new Promise(r => setTimeout(r, 5)); // Small delay to ensure different timestamp
      const updated = await updateList(testUserId, list.id, { name: "Updated Name" });

      expect(updated?.name).toBe("Updated Name");
      expect(updated?.updatedAt).not.toBe(list.updatedAt);
    });

    it("should update list projectId", async () => {
      const project = await createProject(testUserId, "New Project");
      const list = await createList(testUserId, "Orphan List");
      const updated = await updateList(testUserId, list.id, { projectId: project.id });

      expect(updated?.projectId).toBe(project.id);
    });

    it("should remove projectId when set to null", async () => {
      const project = await createProject(testUserId, "Temp Project");
      const list = await createList(testUserId, "Attached List", project.id);
      const updated = await updateList(testUserId, list.id, { projectId: null });

      expect(updated?.projectId).toBeUndefined();
    });

    it("should return null for non-existent list", async () => {
      const result = await updateList(testUserId, "non-existent", { name: "New" });
      expect(result).toBeNull();
    });
  });

  describe("deleteList", () => {
    it("should delete an existing list", async () => {
      const list = await createList(testUserId, "To Delete");
      await deleteList(testUserId, list.id);

      const result = await getList(testUserId, list.id);
      expect(result).toBeNull();
    });

    it("should delete all citations in the list", async () => {
      const list = await createList(testUserId, "List With Citations");
      const citation = await addCitation(
        list.id,
        createSampleCitationFields(),
        "apa",
        "Sample citation text",
        "<p>Sample citation</p>"
      );

      await deleteList(testUserId, list.id);

      const citations = await getListCitations(list.id);
      expect(citations.length).toBe(0);
    });
  });

  describe("findListById", () => {
    it("should find list by ID without userId", async () => {
      const list = await createList(testUserId, "Findable List");
      const found = await findListById(list.id);

      expect(found).not.toBeNull();
      expect(found?.id).toBe(list.id);
    });

    it("should return null for non-existent ID", async () => {
      const result = await findListById("non-existent-id");
      expect(result).toBeNull();
    });
  });
});

describe("Local Store - Projects", () => {
  const testUserId = "project-user-" + Date.now();

  describe("createProject", () => {
    it("should create a new project", async () => {
      const project = await createProject(testUserId, "Research Project");

      expect(project).toBeDefined();
      expect(project.id).toBeDefined();
      expect(project.userId).toBe(testUserId);
      expect(project.name).toBe("Research Project");
      expect(project.createdAt).toBeDefined();
    });

    it("should create project with description", async () => {
      const project = await createProject(testUserId, "Detailed Project", "A detailed description");

      expect(project.description).toBe("A detailed description");
    });
  });

  describe("getProject", () => {
    it("should retrieve an existing project", async () => {
      const created = await createProject(testUserId, "Get Project Test");
      const retrieved = await getProject(testUserId, created.id);

      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.name).toBe("Get Project Test");
    });

    it("should return null for non-existent project", async () => {
      const result = await getProject(testUserId, "non-existent");
      expect(result).toBeNull();
    });
  });

  describe("getUserProjects", () => {
    it("should return all projects for a user", async () => {
      const uniqueUserId = "projects-user-" + Date.now();
      await createProject(uniqueUserId, "Project X");
      await createProject(uniqueUserId, "Project Y");

      const projects = await getUserProjects(uniqueUserId);

      expect(projects.length).toBeGreaterThanOrEqual(2);
    });

    it("should sort projects by creation date (newest first)", async () => {
      const uniqueUserId = "sort-projects-" + Date.now();
      await createProject(uniqueUserId, "First Project");
      await new Promise(r => setTimeout(r, 10));
      await createProject(uniqueUserId, "Second Project");

      const projects = await getUserProjects(uniqueUserId);

      expect(projects[0].name).toBe("Second Project");
      expect(projects[1].name).toBe("First Project");
    });
  });

  describe("updateProject", () => {
    it("should update project name", async () => {
      const project = await createProject(testUserId, "Original Project");
      const updated = await updateProject(testUserId, project.id, { name: "Renamed Project" });

      expect(updated?.name).toBe("Renamed Project");
    });

    it("should update project description", async () => {
      const project = await createProject(testUserId, "Desc Project");
      const updated = await updateProject(testUserId, project.id, { description: "New description" });

      expect(updated?.description).toBe("New description");
    });
  });

  describe("deleteProject", () => {
    it("should delete a project", async () => {
      const project = await createProject(testUserId, "To Delete Project");
      await deleteProject(testUserId, project.id);

      const result = await getProject(testUserId, project.id);
      expect(result).toBeNull();
    });

    it("should remove project association from lists", async () => {
      const project = await createProject(testUserId, "Project With Lists");
      const list = await createList(testUserId, "Attached List", project.id);

      await deleteProject(testUserId, project.id);

      const updatedList = await getList(testUserId, list.id);
      expect(updatedList?.projectId).toBeUndefined();
    });
  });

  describe("getProjectLists", () => {
    it("should return lists belonging to a project", async () => {
      const uniqueUserId = "project-lists-" + Date.now();
      const project = await createProject(uniqueUserId, "Project with Lists");
      await createList(uniqueUserId, "List 1", project.id);
      await createList(uniqueUserId, "List 2", project.id);
      await createList(uniqueUserId, "Standalone List");

      const lists = await getProjectLists(uniqueUserId, project.id);

      expect(lists.length).toBe(2);
      expect(lists.every(l => l.projectId === project.id)).toBe(true);
    });
  });

  describe("findProjectById", () => {
    it("should find project by ID without userId", async () => {
      const project = await createProject(testUserId, "Findable Project");
      const found = await findProjectById(project.id);

      expect(found?.id).toBe(project.id);
    });
  });
});

describe("Local Store - Citations", () => {
  const testUserId = "citation-user-" + Date.now();
  let testListId: string;

  beforeEach(async () => {
    const list = await createList(testUserId, "Citation Test List " + Date.now());
    testListId = list.id;
  });

  describe("addCitation", () => {
    it("should add a citation to a list", async () => {
      const fields = createSampleCitationFields();
      const citation = await addCitation(
        testListId,
        fields,
        "apa",
        "Doe, J. (2024). Sample Article.",
        "<p>Doe, J. (2024). <em>Sample Article</em>.</p>"
      );

      expect(citation).toBeDefined();
      expect(citation.id).toBeDefined();
      expect(citation.listId).toBe(testListId);
      expect(citation.style).toBe("apa");
      expect(citation.fields.title).toBe("Sample Article");
    });

    it("should store formatted text and HTML", async () => {
      const citation = await addCitation(
        testListId,
        createSampleCitationFields(),
        "mla",
        "Plain text citation",
        "<p>HTML citation</p>"
      );

      expect(citation.formattedText).toBe("Plain text citation");
      expect(citation.formattedHtml).toBe("<p>HTML citation</p>");
    });
  });

  describe("getCitation", () => {
    it("should retrieve a citation by ID", async () => {
      const created = await addCitation(
        testListId,
        createSampleCitationFields(),
        "chicago",
        "Chicago style",
        "<p>Chicago</p>"
      );

      const retrieved = await getCitation(testListId, created.id);

      expect(retrieved?.id).toBe(created.id);
      expect(retrieved?.style).toBe("chicago");
    });

    it("should return null for non-existent citation", async () => {
      const result = await getCitation(testListId, "non-existent");
      expect(result).toBeNull();
    });
  });

  describe("getListCitations", () => {
    it("should return all citations in a list", async () => {
      await addCitation(testListId, createSampleCitationFields(), "apa", "1", "<p>1</p>");
      await addCitation(testListId, createSampleCitationFields(), "mla", "2", "<p>2</p>");
      await addCitation(testListId, createSampleCitationFields(), "chicago", "3", "<p>3</p>");

      const citations = await getListCitations(testListId);

      expect(citations.length).toBe(3);
    });

    it("should sort citations by creation date (newest first)", async () => {
      await addCitation(testListId, createSampleCitationFields(), "apa", "First", "<p>1</p>");
      await new Promise(r => setTimeout(r, 10));
      await addCitation(testListId, createSampleCitationFields(), "mla", "Second", "<p>2</p>");

      const citations = await getListCitations(testListId);

      expect(citations[0].formattedText).toBe("Second");
      expect(citations[1].formattedText).toBe("First");
    });
  });

  describe("updateCitation", () => {
    it("should update citation style", async () => {
      const citation = await addCitation(
        testListId,
        createSampleCitationFields(),
        "apa",
        "APA text",
        "<p>APA</p>"
      );

      const updated = await updateCitation(testListId, citation.id, {
        style: "mla" as CitationStyle,
        formattedText: "MLA text",
        formattedHtml: "<p>MLA</p>",
      });

      expect(updated?.style).toBe("mla");
      expect(updated?.formattedText).toBe("MLA text");
    });

    it("should update citation fields", async () => {
      const citation = await addCitation(
        testListId,
        createSampleCitationFields(),
        "apa",
        "text",
        "<p>html</p>"
      );

      const newFields: CitationFields = {
        ...createSampleCitationFields(),
        title: "Updated Title",
      };

      const updated = await updateCitation(testListId, citation.id, { fields: newFields });

      expect(updated?.fields.title).toBe("Updated Title");
    });
  });

  describe("deleteCitation", () => {
    it("should delete a citation", async () => {
      const citation = await addCitation(
        testListId,
        createSampleCitationFields(),
        "harvard",
        "text",
        "<p>html</p>"
      );

      await deleteCitation(testListId, citation.id);

      const result = await getCitation(testListId, citation.id);
      expect(result).toBeNull();
    });
  });
});

describe("Local Store - Share Links", () => {
  const testUserId = "share-user-" + Date.now();

  describe("createShareLink", () => {
    it("should create a share link for a list", async () => {
      const list = await createList(testUserId, "Shareable List");
      const shareLink = await createShareLink("list", list.id);

      expect(shareLink).toBeDefined();
      expect(shareLink.code).toBeDefined();
      expect(shareLink.code.length).toBeGreaterThan(0);
      expect(shareLink.type).toBe("list");
      expect(shareLink.targetId).toBe(list.id);
    });

    it("should create a share link for a project", async () => {
      const project = await createProject(testUserId, "Shareable Project");
      const shareLink = await createShareLink("project", project.id);

      expect(shareLink.type).toBe("project");
      expect(shareLink.targetId).toBe(project.id);
    });

    it("should create share link with expiry", async () => {
      const list = await createList(testUserId, "Expiring Share");
      const shareLink = await createShareLink("list", list.id, 7);

      expect(shareLink.expiresAt).toBeDefined();
      const expiryDate = new Date(shareLink.expiresAt!);
      const now = new Date();
      const daysDiff = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeGreaterThan(6);
      expect(daysDiff).toBeLessThan(8);
    });

    it("should generate unique codes", async () => {
      const list = await createList(testUserId, "Multi Share");
      const share1 = await createShareLink("list", list.id);
      const share2 = await createShareLink("list", list.id);

      expect(share1.code).not.toBe(share2.code);
    });
  });

  describe("getShareLink", () => {
    it("should retrieve a share link by code", async () => {
      const list = await createList(testUserId, "Get Share Test");
      const created = await createShareLink("list", list.id);

      const retrieved = await getShareLink(created.code);

      expect(retrieved?.code).toBe(created.code);
      expect(retrieved?.targetId).toBe(list.id);
    });

    it("should return null for non-existent code", async () => {
      const result = await getShareLink("non-existent-code");
      expect(result).toBeNull();
    });

    it("should return null for expired share link", async () => {
      const list = await createList(testUserId, "Expired Share");
      const shareLink = await createShareLink("list", list.id, -1); // Expired yesterday

      const result = await getShareLink(shareLink.code);
      expect(result).toBeNull();
    });
  });

  describe("deleteShareLink", () => {
    it("should delete a share link", async () => {
      const list = await createList(testUserId, "Delete Share Test");
      const shareLink = await createShareLink("list", list.id);

      await deleteShareLink(shareLink.code);

      const result = await getShareLink(shareLink.code);
      expect(result).toBeNull();
    });
  });
});
