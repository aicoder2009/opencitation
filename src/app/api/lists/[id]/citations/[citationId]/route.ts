import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getList, getCitation, updateCitation, deleteCitation } from "@/lib/db";
import type { CitationFields, CitationStyle } from "@/types";

interface RouteParams {
  params: Promise<{ id: string; citationId: string }>;
}

// GET /api/lists/[id]/citations/[citationId] - Get a single citation
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id: listId, citationId } = await params;

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

    const citation = await getCitation(listId, citationId);

    if (!citation) {
      return NextResponse.json(
        { success: false, error: "Citation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: citation,
    });
  } catch (error) {
    console.error("Error fetching citation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch citation" },
      { status: 500 }
    );
  }
}

// PUT /api/lists/[id]/citations/[citationId] - Update a citation
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id: listId, citationId } = await params;

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
    const { fields, style, formattedText, formattedHtml, tags } = body as {
      fields?: CitationFields;
      style?: CitationStyle;
      formattedText?: string;
      formattedHtml?: string;
      tags?: string[];
    };

    // Validate that at least one field is being updated
    if (!fields && !style && !formattedText && !formattedHtml && tags === undefined) {
      return NextResponse.json(
        { success: false, error: "No updates provided" },
        { status: 400 }
      );
    }

    const citation = await updateCitation(listId, citationId, {
      fields,
      style,
      formattedText,
      formattedHtml,
      tags,
    });

    if (!citation) {
      return NextResponse.json(
        { success: false, error: "Citation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: citation,
    });
  } catch (error) {
    console.error("Error updating citation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update citation" },
      { status: 500 }
    );
  }
}

// DELETE /api/lists/[id]/citations/[citationId] - Delete a citation
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { id: listId, citationId } = await params;

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

    // Verify the citation exists
    const citation = await getCitation(listId, citationId);
    if (!citation) {
      return NextResponse.json(
        { success: false, error: "Citation not found" },
        { status: 404 }
      );
    }

    await deleteCitation(listId, citationId);

    return NextResponse.json({
      success: true,
      message: "Citation deleted",
    });
  } catch (error) {
    console.error("Error deleting citation:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete citation" },
      { status: 500 }
    );
  }
}
