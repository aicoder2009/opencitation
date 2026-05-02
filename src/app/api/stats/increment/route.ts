import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as db from "@/lib/db";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    await db.incrementCitationCount();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error incrementing citation count:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
