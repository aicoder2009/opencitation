import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createList, getUserLists } from "@/lib/db";

// GET /api/lists - Get all lists for the authenticated user
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const lists = await getUserLists(userId);

    return NextResponse.json({
      success: true,
      data: lists,
    });
  } catch (error) {
    console.error("Error fetching lists:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch lists" },
      { status: 500 }
    );
  }
}

// POST /api/lists - Create a new list
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
    const { name, projectId } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const list = await createList(userId, name.trim(), projectId);

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Error creating list:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create list" },
      { status: 500 }
    );
  }
}
