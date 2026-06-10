import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserLists, getUserProjects, getListCitations, type Citation, type List } from "@/lib/db";

const MAX_CITATION_RESULTS = 50;

function matches(query: string, ...haystacks: Array<string | undefined>): boolean {
  return haystacks.some((h) => h?.toLowerCase().includes(query));
}

function citationMatches(query: string, citation: Citation): boolean {
  const { fields } = citation;
  return (
    matches(query, fields.title, fields.subtitle, citation.formattedText, citation.notes) ||
    (citation.tags ?? []).some((tag) => tag.toLowerCase().includes(query)) ||
    (fields.authors ?? []).some((a) =>
      matches(query, a.lastName, a.firstName)
    )
  );
}

// GET /api/search?q= - Search the user's projects, lists, and citations
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();
    if (q.length < 2) {
      return NextResponse.json(
        { success: false, error: "Query must be at least 2 characters" },
        { status: 400 }
      );
    }

    const [lists, projects] = await Promise.all([
      getUserLists(userId),
      getUserProjects(userId),
    ]);

    const matchedProjects = projects
      .filter((p) => matches(q, p.name, p.description))
      .map((p) => ({ id: p.id, name: p.name, description: p.description }));

    const matchedLists = lists
      .filter((l) => matches(q, l.name, l.description))
      .map((l) => ({ id: l.id, name: l.name, description: l.description }));

    const perList = await Promise.all(
      lists.map(async (list: List) => {
        const citations = await getListCitations(list.id);
        return citations
          .filter((c) => citationMatches(q, c))
          .map((c) => ({
            id: c.id,
            listId: list.id,
            listName: list.name,
            title: c.fields.title,
            formattedText: c.formattedText,
            tags: c.tags,
          }));
      })
    );

    const matchedCitations = perList.flat().slice(0, MAX_CITATION_RESULTS);

    return NextResponse.json(
      {
        success: true,
        data: {
          query: q,
          projects: matchedProjects,
          lists: matchedLists,
          citations: matchedCitations,
        },
      },
      { headers: { "Cache-Control": "private, no-cache" } }
    );
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 }
    );
  }
}
