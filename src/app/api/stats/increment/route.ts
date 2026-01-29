import { NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function POST() {
  try {
    await db.incrementCitationCount();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error incrementing citation count:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
