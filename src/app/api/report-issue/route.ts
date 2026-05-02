import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getPostHogClient } from "@/lib/posthog-server";
import { getClientKey, rateLimit } from "@/lib/security/rate-limit";

const GITHUB_REPO = "aicoder2009/opencitation";
const MAX_TITLE_LEN = 200;
const MAX_DESCRIPTION_LEN = 5000;
const MAX_EMAIL_LEN = 254;
const ALLOWED_ISSUE_TYPES = new Set(["bug", "feature", "feedback", "general"]);

export async function POST(request: NextRequest) {
  try {
    // Rate limit anonymous abuse: 5 reports per IP per hour.
    const limit = rateLimit(getClientKey(request, "report-issue"), {
      limit: 5,
      windowMs: 60 * 60 * 1000,
    });
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: "Too many reports. Please try again later." },
        { status: 429 }
      );
    }

    const { userId } = await auth();
    const { title, description, issueType, email } = await request.json();

    // Validate required fields and enforce length caps.
    if (!title || typeof title !== "string" || !description || typeof description !== "string") {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400 }
      );
    }
    if (title.length > MAX_TITLE_LEN) {
      return NextResponse.json(
        { success: false, error: `Title must be ${MAX_TITLE_LEN} characters or fewer` },
        { status: 400 }
      );
    }
    if (description.length > MAX_DESCRIPTION_LEN) {
      return NextResponse.json(
        { success: false, error: `Description must be ${MAX_DESCRIPTION_LEN} characters or fewer` },
        { status: 400 }
      );
    }
    if (email !== undefined && (typeof email !== "string" || email.length > MAX_EMAIL_LEN)) {
      return NextResponse.json(
        { success: false, error: "Invalid email" },
        { status: 400 }
      );
    }
    const issueTypeLower = typeof issueType === "string" ? issueType.toLowerCase() : "";
    const issueTypeAllowed = ALLOWED_ISSUE_TYPES.has(issueTypeLower);
    const safeIssueLabel = issueTypeAllowed ? issueTypeLower : "general";
    const displayIssueType = issueTypeAllowed && typeof issueType === "string"
      ? issueType.trim()
      : "General";

    // Check for GitHub token
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      return NextResponse.json(
        { success: false, error: "GitHub integration not configured" },
        { status: 500 }
      );
    }

    // Build issue body with metadata
    const issueBody = `## Description
${description}

---
**Issue Type:** ${displayIssueType}
**Submitted via:** OpenCitation Report Form
${email ? `**Contact:** ${email}` : ""}
`;

    // Create GitHub issue via API
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `[User Report] ${title}`,
          body: issueBody,
          labels: ["user-reported", safeIssueLabel],
        }),
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error("GitHub API error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create issue" },
        { status: 500 }
      );
    }

    const issue = await response.json();

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: userId ?? "anonymous",
      event: "issue_reported",
      properties: {
        issue_type: safeIssueLabel,
        has_email: !!email,
        issue_number: issue.number,
      },
    });

    return NextResponse.json({
      success: true,
      issueNumber: issue.number,
      issueUrl: issue.html_url,
    });
  } catch (error) {
    console.error("Error creating issue:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
