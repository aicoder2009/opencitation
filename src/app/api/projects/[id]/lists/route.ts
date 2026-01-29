import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getProject, getProjectLists, createList } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/projects/[id]/lists - Get all lists in a project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id: projectId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the project exists and belongs to the user
    const project = await getProject(userId, projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const lists = await getProjectLists(userId, projectId);

    return NextResponse.json({
      success: true,
      data: lists,
    });
  } catch (error) {
    console.error("Error fetching project lists:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch project lists" },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/lists - Create a new list in a project
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id: projectId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the project exists and belongs to the user
    const project = await getProject(userId, projectId);
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name } = body as { name: string };

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "List name is required" },
        { status: 400 }
      );
    }

    const list = await createList(userId, name.trim(), projectId);

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Error creating list in project:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create list in project" },
      { status: 500 }
    );
  }
}
