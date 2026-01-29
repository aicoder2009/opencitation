import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, keys, PREFIXES, generateId, generateShareCode } from "./dynamodb";
import type { CitationFields, CitationStyle } from "@/types";

// Types
export interface List {
  id: string;
  userId: string;
  name: string;
  projectId?: string;
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

  const list: List = {
    id,
    userId,
    name,
    projectId,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: keys.user(userId),
        SK: keys.list(id),
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

  return (result.Items || []).map((item) => ({
    id: item.id,
    userId: item.userId,
    name: item.name,
    projectId: item.projectId,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

export async function updateList(
  userId: string,
  listId: string,
  updates: { name?: string; projectId?: string }
): Promise<List | null> {
  const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
  const expressionNames: Record<string, string> = { "#updatedAt": "updatedAt" };
  const expressionValues: Record<string, unknown> = { ":updatedAt": new Date().toISOString() };

  if (updates.name !== undefined) {
    updateExpressions.push("#name = :name");
    expressionNames["#name"] = "name";
    expressionValues[":name"] = updates.name;
  }

  if (updates.projectId !== undefined) {
    updateExpressions.push("#projectId = :projectId");
    expressionNames["#projectId"] = "projectId";
    expressionValues[":projectId"] = updates.projectId || null;
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: keys.user(userId),
        SK: keys.list(listId),
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
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

  // Then delete the list
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

// ============ CITATIONS ============

export async function addCitation(
  listId: string,
  fields: CitationFields,
  style: CitationStyle,
  formattedText: string,
  formattedHtml: string
): Promise<Citation> {
  const id = generateId();
  const now = new Date().toISOString();

  const citation: Citation = {
    id,
    listId,
    fields,
    style,
    formattedText,
    formattedHtml,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: keys.list(listId),
        SK: keys.citation(id),
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

  return (result.Items || []).map((item) => ({
    id: item.id,
    listId: item.listId,
    fields: item.fields,
    style: item.style,
    formattedText: item.formattedText,
    formattedHtml: item.formattedHtml,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

export async function updateCitation(
  listId: string,
  citationId: string,
  updates: {
    fields?: CitationFields;
    style?: CitationStyle;
    formattedText?: string;
    formattedHtml?: string;
  }
): Promise<Citation | null> {
  const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
  const expressionNames: Record<string, string> = { "#updatedAt": "updatedAt" };
  const expressionValues: Record<string, unknown> = { ":updatedAt": new Date().toISOString() };

  if (updates.fields !== undefined) {
    updateExpressions.push("#fields = :fields");
    expressionNames["#fields"] = "fields";
    expressionValues[":fields"] = updates.fields;
  }

  if (updates.style !== undefined) {
    updateExpressions.push("#style = :style");
    expressionNames["#style"] = "style";
    expressionValues[":style"] = updates.style;
  }

  if (updates.formattedText !== undefined) {
    updateExpressions.push("#formattedText = :formattedText");
    expressionNames["#formattedText"] = "formattedText";
    expressionValues[":formattedText"] = updates.formattedText;
  }

  if (updates.formattedHtml !== undefined) {
    updateExpressions.push("#formattedHtml = :formattedHtml");
    expressionNames["#formattedHtml"] = "formattedHtml";
    expressionValues[":formattedHtml"] = updates.formattedHtml;
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: keys.list(listId),
        SK: keys.citation(citationId),
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionNames,
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

// ============ PROJECTS ============

export async function createProject(userId: string, name: string, description?: string): Promise<Project> {
  const id = generateId();
  const now = new Date().toISOString();

  const project: Project = {
    id,
    userId,
    name,
    description,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: keys.user(userId),
        SK: keys.project(id),
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

  return (result.Items || []).map((item) => ({
    id: item.id,
    userId: item.userId,
    name: item.name,
    description: item.description,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

export async function updateProject(
  userId: string,
  projectId: string,
  updates: { name?: string; description?: string }
): Promise<Project | null> {
  const updateExpressions: string[] = ["#updatedAt = :updatedAt"];
  const expressionNames: Record<string, string> = { "#updatedAt": "updatedAt" };
  const expressionValues: Record<string, unknown> = { ":updatedAt": new Date().toISOString() };

  if (updates.name !== undefined) {
    updateExpressions.push("#name = :name");
    expressionNames["#name"] = "name";
    expressionValues[":name"] = updates.name;
  }

  if (updates.description !== undefined) {
    updateExpressions.push("#description = :description");
    expressionNames["#description"] = "description";
    expressionValues[":description"] = updates.description || null;
  }

  const result = await docClient.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: keys.user(userId),
        SK: keys.project(projectId),
      },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
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
  // First remove project association from all lists
  const lists = await getUserLists(userId);
  for (const list of lists) {
    if (list.projectId === projectId) {
      await updateList(userId, list.id, { projectId: undefined });
    }
  }

  // Then delete the project
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

  const shareLink: ShareLink = {
    code,
    type,
    targetId,
    createdAt: now.toISOString(),
    expiresAt,
  };

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

  // Check expiry
  if (result.Item.expiresAt && new Date(result.Item.expiresAt) < new Date()) {
    return null;
  }

  return {
    code: result.Item.code,
    type: result.Item.type,
    targetId: result.Item.targetId,
    createdAt: result.Item.createdAt,
    expiresAt: result.Item.expiresAt,
  };
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
