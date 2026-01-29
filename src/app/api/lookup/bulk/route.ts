import { NextRequest, NextResponse } from "next/server";

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

    const results: LookupResult[] = [];

    for (const item of items) {
      const trimmedItem = item.trim();
      if (!trimmedItem) {
        results.push({ input: item, success: false, error: "Empty input" });
        continue;
      }

      try {
        let apiEndpoint: string;
        let body: object;

        // Detect input type
        if (trimmedItem.match(/^(https?:\/\/|www\.)/i)) {
          apiEndpoint = "/api/lookup/url";
          body = { url: trimmedItem };
        } else if (trimmedItem.match(/^10\.\d{4,}/)) {
          apiEndpoint = "/api/lookup/doi";
          body = { doi: trimmedItem };
        } else if (trimmedItem.match(/^(97[89])?\d{9}[\dXx]$/)) {
          apiEndpoint = "/api/lookup/isbn";
          body = { isbn: trimmedItem };
        } else {
          // Try DOI format without 10. prefix
          results.push({
            input: trimmedItem,
            success: false,
            error: "Unrecognized format. Please enter a URL, DOI (10.xxxx/...), or ISBN."
          });
          continue;
        }

        // Get the base URL from the request
        const baseUrl = request.nextUrl.origin;

        // Make the API call
        const response = await fetch(`${baseUrl}${apiEndpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await response.json();

        if (response.ok && data.data) {
          results.push({ input: trimmedItem, success: true, data: data.data });
        } else {
          results.push({
            input: trimmedItem,
            success: false,
            error: data.error || "Failed to fetch metadata"
          });
        }
      } catch (err) {
        results.push({
          input: trimmedItem,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error"
        });
      }
    }

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
