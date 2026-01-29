import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getList, getListCitations, addCitation } from "@/lib/db";
import type { CitationFields, CitationStyle } from "@/types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/lists/[id]/citations - Get all citations in a list
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id: listId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the list exists and belongs to the user
    const list = await getList(userId, listId);
    if (!list) {
      return NextResponse.json(
        { success: false, error: "List not found" },
        { status: 404 }
      );
    }

    const citations = await getListCitations(listId);

    return NextResponse.json({
      success: true,
      data: citations,
    });
  } catch (error) {
    console.error("Error fetching citations:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch citations" },
      { status: 500 }
    );
  }
}

// POST /api/lists/[id]/citations - Add a citation to a list
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id: listId } = await params;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify the list exists and belongs to the user
    const list = await getList(userId, listId);
    if (!list) {
      return NextResponse.json(
        { success: false, error: "List not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { fields, style, formattedText, formattedHtml } = body as {
      fields: CitationFields;
      style: CitationStyle;
      formattedText: string;
      formattedHtml: string;
    };

    // Validate required fields
    if (!fields || !style || !formattedText || !formattedHtml) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const citation = await addCitation(listId, fields, style, formattedText, formattedHtml);

    return NextResponse.json({
      success: true,
      data: citation,
    });
  } catch (error) {
    console.error("Error adding citation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add citation" },
      { status: 500 }
    );
  }
}
