import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as db from "@/lib/db";
import { getClientKey, isSameOrigin, rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Require an authenticated session — anonymous traffic cannot move the counter.
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Reject cross-origin POSTs so a third-party page can't pump the counter
    // with a CSRF-style request riding the user's session.
    if (!isSameOrigin(request)) {
      return NextResponse.json({ success: false }, { status: 403 });
    }

    // Cap per-IP increments to slow down scripted abuse.
    const limit = rateLimit(getClientKey(request, "stats-increment"), {
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (!limit.ok) {
      return NextResponse.json({ success: false }, { status: 429 });
    }

    await db.incrementCitationCount();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error incrementing citation count:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
