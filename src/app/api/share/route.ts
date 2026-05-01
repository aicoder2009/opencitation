import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createShareLink,
  getList,
  getProject,
  getUserLists,
  getUserProjects,
  listUserShares,
} from "@/lib/db";
import { getPostHogClient } from "@/lib/posthog-server";

// GET /api/share - List active share links owned by the current user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch shares, lists, and projects concurrently to minimize database latency
    // and resolve the waterfall fetching pattern.
    const [shares, lists, projects] = await Promise.all([
      listUserShares(userId),
      getUserLists(userId),
      getUserProjects(userId),
    ]);

    // Enrich with target name so the UI can render without extra round-trips.
    const listById = new Map(lists.map((l) => [l.id, l]));
    const projectById = new Map(projects.map((p) => [p.id, p]));

    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    const enriched = shares.map((share) => {
      const target =
        share.type === "list"
          ? listById.get(share.targetId)
          : projectById.get(share.targetId);
      return {
        code: share.code,
        type: share.type,
        targetId: share.targetId,
        targetName: target?.name ?? null,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        url: `${base}/share/${share.code}`,
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    console.error("Error listing share links:", error);
    return NextResponse.json(
      { success: false, error: "Failed to list share links" },
      { status: 500 }
    );
  }
}

// POST /api/share - Create a share link
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type, targetId, expiresInDays } = body as {
      type: "list" | "project";
      targetId: string;
      expiresInDays?: number;
    };

    if (!type || !targetId) {
      return NextResponse.json(
        { success: false, error: "Type and targetId are required" },
        { status: 400 }
      );
    }

    if (type !== "list" && type !== "project") {
      return NextResponse.json(
        { success: false, error: "Type must be 'list' or 'project'" },
        { status: 400 }
      );
    }

    // Verify ownership
    if (type === "list") {
      const list = await getList(userId, targetId);
      if (!list) {
        return NextResponse.json(
          { success: false, error: "List not found" },
          { status: 404 }
        );
      }
    } else {
      const project = await getProject(userId, targetId);
      if (!project) {
        return NextResponse.json(
          { success: false, error: "Project not found" },
          { status: 404 }
        );
      }
    }

    const shareLink = await createShareLink(userId, type, targetId, expiresInDays);

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: userId,
      event: "share_link_created",
      properties: {
        share_type: type,
        has_expiry: !!expiresInDays,
        expires_in_days: expiresInDays ?? null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...shareLink,
        url: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/share/${shareLink.code}`,
      },
    });
  } catch (error) {
    console.error("Error creating share link:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create share link" },
      { status: 500 }
    );
  }
}
