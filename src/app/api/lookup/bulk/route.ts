import { NextRequest, NextResponse } from "next/server";
import { POST as lookupUrlPOST } from "../url/route";
import { POST as lookupDoiPOST } from "../doi/route";
import { POST as lookupIsbnPOST } from "../isbn/route";

interface LookupResult {
  input: string;
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body as { items: string[] };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Items array is required" }, { status: 400 });
    }

    // Limit to 20 items at a time
    if (items.length > 20) {
      return NextResponse.json({ error: "Maximum 20 items allowed per request" }, { status: 400 });
    }

    // Process lookups concurrently for performance improvement.
    // We invoke internal Route Handlers directly to avoid SSRF vulnerabilities
    // via dynamic request.nextUrl.origin fetches.
    const lookupPromises = items.map(async (item) => {
      const trimmedItem = item.trim();
      if (!trimmedItem) {
        return { input: item, success: false, error: "Empty input" };
      }

      try {
        let handler: (req: NextRequest) => Promise<NextResponse>;
        let reqBody: object;

        // Detect input type
        if (trimmedItem.match(/^(https?:\/\/|www\.)/i)) {
          handler = lookupUrlPOST;
          reqBody = { url: trimmedItem };
        } else if (trimmedItem.match(/^10\.\d{4,}/)) {
          handler = lookupDoiPOST;
          reqBody = { doi: trimmedItem };
        } else if (trimmedItem.match(/^(97[89])?\d{9}[\dXx]$/)) {
          handler = lookupIsbnPOST;
          reqBody = { isbn: trimmedItem };
        } else {
          return {
            input: trimmedItem,
            success: false,
            error: "Unrecognized format. Please enter a URL, DOI (10.xxxx/...), or ISBN."
          };
        }

        // Construct a synthetic request to pass to the handler
        const syntheticRequest = new NextRequest(new URL("http://localhost"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody),
        });

        // Make the direct handler call
        const response = await handler(syntheticRequest);
        const data = await response.json();

        if (response.ok && data.data) {
          return { input: trimmedItem, success: true, data: data.data };
        }
        return {
          input: trimmedItem,
          success: false,
          error: data.error || "Failed to fetch metadata"
        };
      } catch (err) {
        return {
          input: trimmedItem,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error"
        };
      }
    });

    const results: LookupResult[] = await Promise.all(lookupPromises);

    return NextResponse.json({
      results,
      summary: {
        total: items.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }
    });
  } catch (error) {
    console.error("Bulk lookup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
