import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getShareLink,
  deleteShareLink,
  getListCitations,
  getUserLists,
} from "@/lib/db";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";
import { docClient, TABLE_NAME, PREFIXES, keys } from "@/lib/db/dynamodb";

interface RouteParams {
  params: Promise<{ code: string }>;
}

// GET /api/share/[code] - Get shared content (public, no auth required)
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;

    const shareLink = await getShareLink(code);

    if (!shareLink) {
      return NextResponse.json(
        { success: false, error: "Share link not found or expired" },
        { status: 404 }
      );
    }

    if (shareLink.type === "list") {
      // Get list details - need to scan since we don't have userId
      const listResult = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "GSI1", // Assumes GSI on entityType
          KeyConditionExpression: "entityType = :type",
          FilterExpression: "id = :id",
          ExpressionAttributeValues: {
            ":type": "LIST",
            ":id": shareLink.targetId,
          },
        })
      );

      // If no GSI, try scanning by list key
      let listData = listResult.Items?.[0];

      if (!listData) {
        // Fallback: Get citations directly using list prefix
        const citations = await getListCitations(shareLink.targetId);
        return NextResponse.json({
          success: true,
          data: {
            type: "list",
            id: shareLink.targetId,
            name: "Shared List",
            citations: citations.map((c) => ({
              id: c.id,
              style: c.style,
              formattedText: c.formattedText,
              formattedHtml: c.formattedHtml,
              createdAt: c.createdAt,
            })),
          },
        });
      }

      const citations = await getListCitations(shareLink.targetId);

      return NextResponse.json({
        success: true,
        data: {
          type: "list",
          id: listData.id,
          name: listData.name,
          citations: citations.map((c) => ({
            id: c.id,
            style: c.style,
            formattedText: c.formattedText,
            formattedHtml: c.formattedHtml,
            createdAt: c.createdAt,
          })),
        },
      });
    } else {
      // Project sharing - get project with all its lists and citations
      const projectResult = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          IndexName: "GSI1",
          KeyConditionExpression: "entityType = :type",
          FilterExpression: "id = :id",
          ExpressionAttributeValues: {
            ":type": "PROJECT",
            ":id": shareLink.targetId,
          },
        })
      );

      const projectData = projectResult.Items?.[0];

      if (!projectData) {
        return NextResponse.json({
          success: true,
          data: {
            type: "project",
            id: shareLink.targetId,
            name: "Shared Project",
            lists: [],
          },
        });
      }

      // Get all lists in project
      const listsResult = await docClient.send(
        new QueryCommand({
          TableName: TABLE_NAME,
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
          FilterExpression: "projectId = :projectId",
          ExpressionAttributeValues: {
            ":pk": keys.user(projectData.userId),
            ":sk": PREFIXES.LIST,
            ":projectId": shareLink.targetId,
          },
        })
      );

      const listsWithCitations = await Promise.all(
        (listsResult.Items || []).map(async (list) => {
          const citations = await getListCitations(list.id);
          return {
            id: list.id,
            name: list.name,
            citations: citations.map((c) => ({
              id: c.id,
              style: c.style,
              formattedText: c.formattedText,
              formattedHtml: c.formattedHtml,
              createdAt: c.createdAt,
            })),
          };
        })
      );

      return NextResponse.json({
        success: true,
        data: {
          type: "project",
          id: projectData.id,
          name: projectData.name,
          description: projectData.description,
          lists: listsWithCitations,
        },
      });
    }
  } catch (error) {
    console.error("Error fetching shared content:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shared content" },
      { status: 500 }
    );
  }
}

// DELETE /api/share/[code] - Revoke a share link (requires auth)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { code } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const shareLink = await getShareLink(code);

    if (!shareLink) {
      return NextResponse.json(
        { success: false, error: "Share link not found" },
        { status: 404 }
      );
    }

    // TODO: Verify ownership of the shared resource
    // For now, allow any authenticated user to delete (should add ownership check)

    await deleteShareLink(code);

    return NextResponse.json({
      success: true,
      message: "Share link revoked",
    });
  } catch (error) {
    console.error("Error revoking share link:", error);
    return NextResponse.json(
      { success: false, error: "Failed to revoke share link" },
      { status: 500 }
    );
  }
}
