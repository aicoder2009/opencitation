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
import { buildShareSegment, slugify } from "@/lib/share-utils";
import { hashSharePassword } from "@/lib/share-password";

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

    // Fetch shares, lists, and projects concurrently to remove waterfall latency.
    const [shares, lists, projects] = await Promise.all([
      listUserShares(userId),
      getUserLists(userId),
      getUserProjects(userId),
    ]);
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
        slug: share.slug ?? null,
        type: share.type,
        targetId: share.targetId,
        targetName: target?.name ?? null,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        hasPassword: !!share.passwordHash,
        maxViews: share.maxViews ?? null,
        viewCount: share.viewCount ?? 0,
        lastViewedAt: share.lastViewedAt ?? null,
        url: `${base}/share/${buildShareSegment(share.code, share.slug)}`,
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
    const { type, targetId, expiresInDays, slug: rawSlug, password, maxViews } = body as {
      type: "list" | "project";
      targetId: string;
      expiresInDays?: number;
      slug?: string;
      password?: string;
      maxViews?: number;
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

    const slug = rawSlug ? slugify(rawSlug) || undefined : undefined;
    const passwordHash = password && password.length > 0 ? hashSharePassword(password) : undefined;
    const cap = maxViews && Number.isFinite(maxViews) && maxViews > 0
      ? Math.floor(maxViews)
      : undefined;

    const shareLink = await createShareLink(userId, type, targetId, expiresInDays, slug, passwordHash, cap);

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: userId,
      event: "share_link_created",
      properties: {
        share_type: type,
        has_expiry: !!expiresInDays,
        expires_in_days: expiresInDays ?? null,
        has_slug: !!slug,
        has_password: !!passwordHash,
        has_view_limit: !!cap,
        max_views: cap ?? null,
      },
    });

    // Never leak the passwordHash to the client.
    const { passwordHash: _omit, ...safeShare } = shareLink;
    return NextResponse.json({
      success: true,
      data: {
        ...safeShare,
        hasPassword: !!shareLink.passwordHash,
        url: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/share/${buildShareSegment(shareLink.code, shareLink.slug)}`,
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
