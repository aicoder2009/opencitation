import { NextRequest, NextResponse } from "next/server";
import * as db from "@/lib/db";
import { getClientKey, isSameOrigin, rateLimit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Reject cross-origin POSTs so a third-party page can't pump the counter.
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
