import { NextRequest, NextResponse } from "next/server";

const GITHUB_REPO = "aicoder2009/opencitation";

export async function POST(request: NextRequest) {
  try {
    const { title, description, issueType, email } = await request.json();

    // Validate required fields
    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: "Title and description are required" },
        { status: 400 }
      );
    }

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
**Issue Type:** ${issueType || "General"}
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
          labels: ["user-reported", issueType?.toLowerCase() || "general"],
        }),
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
