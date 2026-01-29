import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createShareLink, getList, getProject } from "@/lib/db";

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

    const shareLink = await createShareLink(type, targetId, expiresInDays);

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
