import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getList, updateList, deleteList } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/lists/[id] - Get a single list
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const list = await getList(userId, id);

    if (!list) {
      return NextResponse.json(
        { success: false, error: "List not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Error fetching list:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch list" },
      { status: 500 }
    );
  }
}

// PUT /api/lists/[id] - Update a list
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, projectId } = body;

    // Validate that at least one field is being updated
    if (name === undefined && projectId === undefined) {
      return NextResponse.json(
        { success: false, error: "No updates provided" },
        { status: 400 }
      );
    }

    const updates: { name?: string; projectId?: string } = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { success: false, error: "Invalid name" },
          { status: 400 }
        );
      }
      updates.name = name.trim();
    }
    if (projectId !== undefined) {
      updates.projectId = projectId;
    }

    const list = await updateList(userId, id, updates);

    if (!list) {
      return NextResponse.json(
        { success: false, error: "List not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Error updating list:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update list" },
      { status: 500 }
    );
  }
}

// DELETE /api/lists/[id] - Delete a list
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the list exists and belongs to the user
    const list = await getList(userId, id);
    if (!list) {
      return NextResponse.json(
        { success: false, error: "List not found" },
        { status: 404 }
      );
    }

    await deleteList(userId, id);

    return NextResponse.json({
      success: true,
      message: "List deleted",
    });
  } catch (error) {
    console.error("Error deleting list:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete list" },
      { status: 500 }
    );
  }
}
