import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import type { CitationFields, CitationStyle } from "@/types";

// Initialize DynamoDB client
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      }
    : undefined,
});

// Create document client with marshalling options
export const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
    convertEmptyValues: false,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
});

// Table name from environment
export const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME || "opencitation";

// Key prefixes for single-table design
export const PREFIXES = {
  USER: "USER#",
  LIST: "LIST#",
  PROJECT: "PROJECT#",
  CITATION: "CITATION#",
  SHARE: "SHARE#",
  STATS: "STATS#",
  PROFILE: "PROFILE",
  META: "META",
  COUNTERS: "COUNTERS",
} as const;

// Helper to generate keys
export const keys = {
  user: (userId: string) => `${PREFIXES.USER}${userId}`,
  list: (listId: string) => `${PREFIXES.LIST}${listId}`,
  project: (projectId: string) => `${PREFIXES.PROJECT}${projectId}`,
  citation: (citationId: string) => `${PREFIXES.CITATION}${citationId}`,
  share: (shareCode: string) => `${PREFIXES.SHARE}${shareCode}`,
};

// Generate unique IDs
export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

// Generate share codes (shorter, URL-safe)
export function generateShareCode(): string {
  return Math.random().toString(36).substring(2, 10);
}

// ============ TYPES ============

export interface List {
  id: string;
  userId: string;
  name: string;
  projectId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Citation {
  id: string;
  listId: string;
  fields: CitationFields;
  style: CitationStyle;
  formattedText: string;
  formattedHtml: string;
  tags?: string[];
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShareLink {
  code: string;
  type: "list" | "project";
  targetId: string;
  createdAt: string;
  expiresAt?: string;
}

// ============ LISTS ============

export async function createList(userId: string, name: string, projectId?: string): Promise<List> {
  const id = generateId();
  const now = new Date().toISOString();
  const list: List = { id, userId, name, projectId, createdAt: now, updatedAt: now };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: keys.user(userId),
        SK: keys.list(id),
        GSI1PK: keys.list(id),
        GSI1SK: keys.user(userId),
        ...list,
        entityType: "LIST",
      },
    })
  );

  return list;
}

export async function getList(userId: string, listId: string): Promise<List | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: keys.user(userId),
        SK: keys.list(listId),
      },
    })
  );

  if (!result.Item) return null;

  return {
    id: result.Item.id,
    userId: result.Item.userId,
    name: result.Item.name,
    projectId: result.Item.projectId,
    createdAt: result.Item.createdAt,
    updatedAt: result.Item.updatedAt,
  };
}

export async function getUserLists(userId: string): Promise<List[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": keys.user(userId),
        ":sk": PREFIXES.LIST,
      },
    })
  );

  const lists = (result.Items || []).map((item) => ({
    id: item.id,
    userId: item.userId,
    name: item.name,
    projectId: item.projectId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  return lists.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateList(
  userId: string,
  listId: string,
  updates: { name?: string; projectId?: string | null }
): Promise<List | null> {
  const existing = await getList(userId, listId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updateExpressions: string[] = ["updatedAt = :updatedAt"];
  const expressionValues: Record<string, unknown> = { ":updatedAt": now };

  if (updates.name !== undefined) {
    updateExpressions.push("#n = :name");
    expressionValues[":name"] = updates.name;
  }

  if (updates.projectId !== undefined) {
    if (updates.projectId === null) {
      updateExpressions.push("REMOVE projectId");
    } else {
      updateExpressions.push("projectId = :projectId");
      expressionValues[":projectId"] = updates.projectId;
    }
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: keys.user(userId),
        SK: keys.list(listId),
      },
      UpdateExpression: `SET ${updateExpressions.filter((e) => !e.startsWith("REMOVE")).join(", ")}${updateExpressions.some((e) => e.startsWith("REMOVE")) ? " REMOVE projectId" : ""}`,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: updates.name !== undefined ? { "#n": "name" } : undefined,
      ReturnValues: "ALL_NEW",
    })
  );

  if (!result.Attributes) return null;

  return {
    id: result.Attributes.id,
    userId: result.Attributes.userId,
    name: result.Attributes.name,
    projectId: result.Attributes.projectId,
    createdAt: result.Attributes.createdAt,
    updatedAt: result.Attributes.updatedAt,
  };
}

export async function deleteList(userId: string, listId: string): Promise<void> {
  // First delete all citations in the list
  const citations = await getListCitations(listId);
  for (const citation of citations) {
    await deleteCitation(listId, citation.id);
  }

  // Then delete the list itself
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: keys.user(userId),
        SK: keys.list(listId),
      },
    })
  );
}

// ============ PROJECTS ============

export async function createProject(userId: string, name: string, description?: string): Promise<Project> {
  const id = generateId();
  const now = new Date().toISOString();
  const project: Project = { id, userId, name, description, createdAt: now, updatedAt: now };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: keys.user(userId),
        SK: keys.project(id),
        GSI1PK: keys.project(id),
        GSI1SK: keys.user(userId),
        ...project,
        entityType: "PROJECT",
      },
    })
  );

  return project;
}

export async function getProject(userId: string, projectId: string): Promise<Project | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: keys.user(userId),
        SK: keys.project(projectId),
      },
    })
  );

  if (!result.Item) return null;

  return {
    id: result.Item.id,
    userId: result.Item.userId,
    name: result.Item.name,
    description: result.Item.description,
    createdAt: result.Item.createdAt,
    updatedAt: result.Item.updatedAt,
  };
}

export async function getUserProjects(userId: string): Promise<Project[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": keys.user(userId),
        ":sk": PREFIXES.PROJECT,
      },
    })
  );

  const projects = (result.Items || []).map((item) => ({
    id: item.id,
    userId: item.userId,
    name: item.name,
    description: item.description,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  return projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateProject(
  userId: string,
  projectId: string,
  updates: { name?: string; description?: string }
): Promise<Project | null> {
  const existing = await getProject(userId, projectId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updateExpressions: string[] = ["updatedAt = :updatedAt"];
  const expressionValues: Record<string, unknown> = { ":updatedAt": now };
  const expressionNames: Record<string, string> = {};

  if (updates.name !== undefined) {
    updateExpressions.push("#n = :name");
    expressionValues[":name"] = updates.name;
    expressionNames["#n"] = "name";
  }

  if (updates.description !== undefined) {
    updateExpressions.push("description = :description");
    expressionValues[":description"] = updates.description;
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: keys.user(userId),
        SK: keys.project(projectId),
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: Object.keys(expressionNames).length > 0 ? expressionNames : undefined,
      ReturnValues: "ALL_NEW",
    })
  );

  if (!result.Attributes) return null;

  return {
    id: result.Attributes.id,
    userId: result.Attributes.userId,
    name: result.Attributes.name,
    description: result.Attributes.description,
    createdAt: result.Attributes.createdAt,
    updatedAt: result.Attributes.updatedAt,
  };
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  // Remove project association from lists (but don't delete them)
  const lists = await getUserLists(userId);
  for (const list of lists) {
    if (list.projectId === projectId) {
      await updateList(userId, list.id, { projectId: null });
    }
  }

  // Delete the project
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: keys.user(userId),
        SK: keys.project(projectId),
      },
    })
  );
}

export async function getProjectLists(userId: string, projectId: string): Promise<List[]> {
  const lists = await getUserLists(userId);
  return lists.filter((list) => list.projectId === projectId);
}

// ============ CITATIONS ============

export async function addCitation(
  listId: string,
  fields: CitationFields,
  style: CitationStyle,
  formattedText: string,
  formattedHtml: string,
  tags?: string[]
): Promise<Citation> {
  const id = generateId();
  const now = new Date().toISOString();
  const citation: Citation = { id, listId, fields, style, formattedText, formattedHtml, tags, createdAt: now, updatedAt: now };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: keys.list(listId),
        SK: keys.citation(id),
        GSI1PK: keys.citation(id),
        GSI1SK: keys.list(listId),
        ...citation,
        entityType: "CITATION",
      },
    })
  );

  return citation;
}

export async function getCitation(listId: string, citationId: string): Promise<Citation | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: keys.list(listId),
        SK: keys.citation(citationId),
      },
    })
  );

  if (!result.Item) return null;

  return {
    id: result.Item.id,
    listId: result.Item.listId,
    fields: result.Item.fields,
    style: result.Item.style,
    formattedText: result.Item.formattedText,
    formattedHtml: result.Item.formattedHtml,
    tags: result.Item.tags,
    createdAt: result.Item.createdAt,
    updatedAt: result.Item.updatedAt,
  };
}

export async function getListCitations(listId: string): Promise<Citation[]> {
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": keys.list(listId),
        ":sk": PREFIXES.CITATION,
      },
    })
  );

  const citations = (result.Items || []).map((item) => ({
    id: item.id,
    listId: item.listId,
    fields: item.fields,
    style: item.style,
    formattedText: item.formattedText,
    formattedHtml: item.formattedHtml,
    tags: item.tags,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));

  // Sort by sortOrder if available, otherwise by createdAt (newest first)
  return citations.sort((a, b) => {
    if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
      return a.sortOrder - b.sortOrder;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function updateCitation(
  listId: string,
  citationId: string,
  updates: { fields?: CitationFields; style?: CitationStyle; formattedText?: string; formattedHtml?: string; tags?: string[] }
): Promise<Citation | null> {
  const existing = await getCitation(listId, citationId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const updateExpressions: string[] = ["updatedAt = :updatedAt"];
  const expressionValues: Record<string, unknown> = { ":updatedAt": now };

  if (updates.fields !== undefined) {
    updateExpressions.push("fields = :fields");
    expressionValues[":fields"] = updates.fields;
  }

  if (updates.style !== undefined) {
    updateExpressions.push("style = :style");
    expressionValues[":style"] = updates.style;
  }

  if (updates.formattedText !== undefined) {
    updateExpressions.push("formattedText = :formattedText");
    expressionValues[":formattedText"] = updates.formattedText;
  }

  if (updates.formattedHtml !== undefined) {
    updateExpressions.push("formattedHtml = :formattedHtml");
    expressionValues[":formattedHtml"] = updates.formattedHtml;
  }

  if (updates.tags !== undefined) {
    updateExpressions.push("tags = :tags");
    expressionValues[":tags"] = updates.tags;
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: keys.list(listId),
        SK: keys.citation(citationId),
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: "ALL_NEW",
    })
  );

  if (!result.Attributes) return null;

  return {
    id: result.Attributes.id,
    listId: result.Attributes.listId,
    fields: result.Attributes.fields,
    style: result.Attributes.style,
    formattedText: result.Attributes.formattedText,
    formattedHtml: result.Attributes.formattedHtml,
    tags: result.Attributes.tags,
    createdAt: result.Attributes.createdAt,
    updatedAt: result.Attributes.updatedAt,
  };
}

export async function deleteCitation(listId: string, citationId: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: keys.list(listId),
        SK: keys.citation(citationId),
      },
    })
  );
}

export async function reorderCitations(listId: string, citationIds: string[]): Promise<void> {
  const now = new Date().toISOString();

  // Update each citation with its new sortOrder
  await Promise.all(
    citationIds.map((citationId, index) =>
      docClient.send(
        new UpdateCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: keys.list(listId),
            SK: keys.citation(citationId),
          },
          UpdateExpression: "SET sortOrder = :sortOrder, updatedAt = :updatedAt",
          ExpressionAttributeValues: {
            ":sortOrder": index,
            ":updatedAt": now,
          },
        })
      )
    )
  );
}

// ============ SHARE LINKS ============

export async function createShareLink(
  type: "list" | "project",
  targetId: string,
  expiresInDays?: number
): Promise<ShareLink> {
  const code = generateShareCode();
  const now = new Date();
  const expiresAt = expiresInDays
    ? new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : undefined;
  const shareLink: ShareLink = { code, type, targetId, createdAt: now.toISOString(), expiresAt };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: keys.share(code),
        SK: PREFIXES.META,
        ...shareLink,
        entityType: "SHARE",
      },
    })
  );

  return shareLink;
}

export async function getShareLink(code: string): Promise<ShareLink | null> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: keys.share(code),
        SK: PREFIXES.META,
      },
    })
  );

  if (!result.Item) return null;

  const shareLink: ShareLink = {
    code: result.Item.code,
    type: result.Item.type,
    targetId: result.Item.targetId,
    createdAt: result.Item.createdAt,
    expiresAt: result.Item.expiresAt,
  };

  // Check if expired
  if (shareLink.expiresAt && new Date(shareLink.expiresAt) < new Date()) {
    return null;
  }

  return shareLink;
}

export async function deleteShareLink(code: string): Promise<void> {
  await docClient.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: keys.share(code),
        SK: PREFIXES.META,
      },
    })
  );
}

// ============ HELPER FUNCTIONS ============

export async function findListById(listId: string): Promise<List | null> {
  // Use GSI1 to find list by ID (without knowing userId)
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: {
        ":pk": keys.list(listId),
      },
      Limit: 1,
    })
  );

  if (!result.Items || result.Items.length === 0) return null;

  const item = result.Items[0];
  return {
    id: item.id,
    userId: item.userId,
    name: item.name,
    projectId: item.projectId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export async function findProjectById(projectId: string): Promise<Project | null> {
  // Use GSI1 to find project by ID (without knowing userId)
  const result = await docClient.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: {
        ":pk": keys.project(projectId),
      },
      Limit: 1,
    })
  );

  if (!result.Items || result.Items.length === 0) return null;

  const item = result.Items[0];
  return {
    id: item.id,
    userId: item.userId,
    name: item.name,
    description: item.description,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// ============ STATS ============

export async function getStats(): Promise<{ citationsGenerated: number }> {
  const result = await docClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `${PREFIXES.STATS}GLOBAL`,
        SK: PREFIXES.COUNTERS,
      },
    })
  );

  if (!result.Item) {
    return { citationsGenerated: 0 };
  }

  return { citationsGenerated: result.Item.citationsGenerated || 0 };
}

export async function incrementCitationCount(): Promise<void> {
  await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `${PREFIXES.STATS}GLOBAL`,
        SK: PREFIXES.COUNTERS,
      },
      UpdateExpression: "SET citationsGenerated = if_not_exists(citationsGenerated, :zero) + :inc, updatedAt = :now",
      ExpressionAttributeValues: {
        ":inc": 1,
        ":zero": 0,
        ":now": new Date().toISOString(),
      },
    })
  );
}
