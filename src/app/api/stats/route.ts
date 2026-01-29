import { NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function GET() {
  try {
    const stats = await db.getStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ citationsGenerated: 0 });
  }
}
