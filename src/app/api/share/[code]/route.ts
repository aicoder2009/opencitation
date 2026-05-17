import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getShareLink,
  deleteShareLink,
  getListCitations,
  findListById,
  findProjectById,
  getUserLists,
  recordShareView,
} from "@/lib/db";
import { createHash } from "crypto";
import { parseShareSegment } from "@/lib/share-utils";
import { verifySharePassword } from "@/lib/share-password";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";

// Compute a weak ETag from the salient fields of the response payload.
// Cheap, deterministic, dependent on the actual rendered content rather
// than wall-clock time.
function computeEtag(parts: (string | number | undefined | null)[]): string {
  const h = createHash("sha1");
  h.update(parts.map((p) => String(p ?? "")).join(""));
  return `W/"${h.digest("base64url").slice(0, 16)}"`;
}

interface RouteParams {
  params: Promise<{ code: string }>;
}

// Rate-limit: 30 burst, refill 1 token/sec ⇒ ~60 req/min steady state.
const READ_RATE = { capacity: 30, refillRatePerMs: 1 / 1000 };

// GET /api/share/[code] - Get shared content (public, no auth required).
// Accepts both /share/<code> and /share/<slug>--<code>.
// If the share is password-protected, requires the password via the
// "x-share-password" header.
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code: segment } = await params;
    const { code } = parseShareSegment(segment);

    // Rate-limit by (client IP, code). Per-code bucketing prevents one
    // hot share from starving others from the same IP (e.g. a classroom
    // NAT).
    const rl = checkRateLimit(`share-get:${clientKey(request)}:${code}`, READ_RATE);
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, error: "Too many requests" },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.retryAfter),
          },
        },
      );
    }

    const shareLink = await getShareLink(code);

    if (!shareLink) {
      return NextResponse.json(
        { success: false, error: "Share link not found or expired" },
        { status: 404 }
      );
    }

    // Password gate. We respond with 401 + requiresPassword so the client
    // can render the password form without leaking whether the password
    // is wrong vs. missing.
    if (shareLink.passwordHash) {
      const candidate = request.headers.get("x-share-password");
      if (!candidate || !verifySharePassword(candidate, shareLink.passwordHash)) {
        return NextResponse.json(
          {
            success: false,
            error: "Password required",
            requiresPassword: true,
          },
          { status: 401 },
        );
      }
    }

    // Increment view counter (atomic, cap-aware). If the cap just got
    // exhausted by a concurrent request we treat as 404.
    const newCount = await recordShareView(shareLink.code);
    if (newCount === null) {
      return NextResponse.json(
        { success: false, error: "Share link not found or expired" },
        { status: 404 },
      );
    }

    const shareMeta = {
      createdAt: shareLink.createdAt,
      expiresAt: shareLink.expiresAt,
      hasPassword: !!shareLink.passwordHash,
    };

    if (shareLink.type === "list") {
      // Fetch list details and citations concurrently to avoid waterfall
      const [listData, citations] = await Promise.all([
        findListById(shareLink.targetId),
        getListCitations(shareLink.targetId),
      ]);

      if (!listData) {
        return NextResponse.json(
          {
            success: false,
            error: "The shared list is no longer available.",
          },
          { status: 410 }
        );
      }

      const etag = computeEtag([
        "list",
        shareLink.code,
        listData.id,
        listData.name,
        citations.length,
        citations[citations.length - 1]?.id,
        listData.updatedAt,
      ]);
      if (request.headers.get("if-none-match") === etag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            ETag: etag,
            "Cache-Control": "public, max-age=60, must-revalidate",
          },
        });
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            type: "list",
            id: listData.id,
            name: listData.name,
            share: shareMeta,
            citations: citations.map((c) => ({
              id: c.id,
              style: c.style,
              formattedText: c.formattedText,
              formattedHtml: c.formattedHtml,
              createdAt: c.createdAt,
            })),
          },
        },
        {
          headers: {
            "Cache-Control": "public, max-age=60, must-revalidate",
            ETag: etag,
          },
        },
      );
    }
      // Project sharing - get project with all its lists and citations
      // Fetch project details and user lists concurrently by utilizing the shareLink's owner ID
      const [projectData, allLists] = await Promise.all([
        findProjectById(shareLink.targetId),
        getUserLists(shareLink.userId),
      ]);

      if (!projectData) {
        return NextResponse.json(
          {
            success: false,
            error: "The shared project is no longer available.",
          },
          { status: 410 }
        );
      }

      // Get all lists in project
      const projectLists = allLists.filter((list) => list.projectId === shareLink.targetId);

      const listsWithCitations = await Promise.all(
        projectLists.map(async (list) => {
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

      const projectEtag = computeEtag([
        "project",
        shareLink.code,
        projectData.id,
        projectData.name,
        projectData.updatedAt,
        listsWithCitations.length,
        listsWithCitations.reduce((sum, l) => sum + l.citations.length, 0),
      ]);
      if (request.headers.get("if-none-match") === projectEtag) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            ETag: projectEtag,
            "Cache-Control": "public, max-age=60, must-revalidate",
          },
        });
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            type: "project",
            id: projectData.id,
            name: projectData.name,
            description: projectData.description,
            share: shareMeta,
            lists: listsWithCitations,
          },
        },
        {
          headers: {
            "Cache-Control": "public, max-age=60, must-revalidate",
            ETag: projectEtag,
          },
        },
      );
    
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
    const { code: segment } = await params;
    const { code } = parseShareSegment(segment);

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

    if (shareLink.userId !== userId) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

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
