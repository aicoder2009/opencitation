import { NextResponse } from "next/server";
import * as db from "@/lib/db";

export async function GET() {
  try {
    const stats = await db.getStats();
    const count = stats.citationsGenerated;

    // Format count for display
    let countDisplay = "";
    if (count >= 1000000) {
      countDisplay = `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      countDisplay = `${(count / 1000).toFixed(1)}K`;
    } else if (count > 0) {
      countDisplay = count.toString();
    }

    // Calculate badge width based on whether we show count
    const showCount = count > 0;
    const badgeWidth = showCount ? 180 : 150;
    const textX = showCount ? 75 : 88;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${badgeWidth}" height="26" viewBox="0 0 ${badgeWidth} 26">
  <rect width="${badgeWidth}" height="26" fill="#f9f9f9" stroke="#a2a9b1" stroke-width="1"/>
  <rect x="1" y="1" width="24" height="24" fill="#3366cc"/>
  <text x="13" y="18" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">C</text>
  <text x="${textX}" y="17" font-family="Arial, sans-serif" font-size="11" fill="#202122" text-anchor="middle">Cite with OpenCitation</text>
  ${showCount ? `<rect x="${badgeWidth - 35}" y="4" width="30" height="18" rx="2" fill="#3366cc"/>
  <text x="${badgeWidth - 20}" y="17" font-family="Arial, sans-serif" font-size="10" fill="white" text-anchor="middle">${countDisplay}</text>` : ""}
</svg>`;

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating badge:", error);
    // Return simple badge on error
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="26" viewBox="0 0 150 26">
  <rect width="150" height="26" fill="#f9f9f9" stroke="#a2a9b1" stroke-width="1"/>
  <rect x="1" y="1" width="24" height="24" fill="#3366cc"/>
  <text x="13" y="18" font-family="Georgia, serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">C</text>
  <text x="88" y="17" font-family="Arial, sans-serif" font-size="11" fill="#202122" text-anchor="middle">Cite with OpenCitation</text>
</svg>`;
    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
      },
    });
  }
}
