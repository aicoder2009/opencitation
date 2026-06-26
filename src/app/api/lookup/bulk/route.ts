import { NextRequest, NextResponse } from "next/server";
import { POST as urlLookup } from "@/app/api/lookup/url/route";
import { POST as doiLookup } from "@/app/api/lookup/doi/route";
import { POST as isbnLookup } from "@/app/api/lookup/isbn/route";

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

    // Refactored to process lookups concurrently for performance improvement
    const lookupPromises = items.map(async (item) => {
      const trimmedItem = item.trim();
      if (!trimmedItem) {
        return { input: item, success: false, error: "Empty input" };
      }

      try {
        let handler: (req: NextRequest) => Promise<NextResponse>;
        let handlerUrl: string;
        let handlerBody: object;

        // Detect input type
        if (trimmedItem.match(/^(https?:\/\/|www\.)/i)) {
          handler = urlLookup;
          handlerUrl = "http://localhost/api/lookup/url";
          handlerBody = { url: trimmedItem };
        } else if (trimmedItem.match(/^10\.\d{4,}/)) {
          handler = doiLookup;
          handlerUrl = "http://localhost/api/lookup/doi";
          handlerBody = { doi: trimmedItem };
        } else if (trimmedItem.match(/^(97[89])?\d{9}[\dXx]$/)) {
          handler = isbnLookup;
          handlerUrl = "http://localhost/api/lookup/isbn";
          handlerBody = { isbn: trimmedItem };
        } else {
          return {
            input: trimmedItem,
            success: false,
            error: "Unrecognized format. Please enter a URL, DOI (10.xxxx/...), or ISBN."
          };
        }

        const syntheticRequest = new NextRequest(handlerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(handlerBody),
        });

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
