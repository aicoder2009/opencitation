/**
 * Reorder Citations API
 *
 * Updates the order of citations within a list
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import * as db from '@/lib/db';

interface ReorderRequest {
  citationIds: string[];
}

interface APIResponse {
  success: boolean;
  error?: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<APIResponse>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: listId } = await params;
    const body: ReorderRequest = await request.json();
    const { citationIds } = body;

    if (!citationIds || !Array.isArray(citationIds)) {
      return NextResponse.json(
        { success: false, error: 'citationIds array is required' },
        { status: 400 }
      );
    }

    // Verify list belongs to user
    const list = await db.getList(userId, listId);
    if (!list) {
      return NextResponse.json(
        { success: false, error: 'List not found' },
        { status: 404 }
      );
    }

    // Update order for each citation
    await db.reorderCitations(listId, citationIds);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error reordering citations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reorder citations' },
      { status: 500 }
    );
  }
}
