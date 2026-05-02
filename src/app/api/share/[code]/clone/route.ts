import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getShareLink,
  findListById,
  findProjectById,
  getListCitations,
  getProjectLists,
  createList,
  createProject,
  addCitation,
  reorderCitations,
} from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { success: false, error: "Sign in to save" },
      { status: 401 }
    );
  }

  const { code } = await params;
  const shareLink = await getShareLink(code);
  if (!shareLink) {
    return NextResponse.json(
      { success: false, error: "Share link not found or expired" },
      { status: 404 }
    );
  }

  try {
    if (shareLink.type === "list") {
      const originalList = await findListById(shareLink.targetId);
      if (!originalList) {
        return NextResponse.json(
          { success: false, error: "Original list not found" },
          { status: 404 }
        );
      }

      const citations = await getListCitations(shareLink.targetId);
      const newList = await createList(userId, originalList.name, undefined, originalList.description);

      const newCitations = await Promise.all(
        citations.map((c) =>
          addCitation(
            newList.id,
            c.fields,
            c.style,
            c.formattedText,
            c.formattedHtml,
            c.tags,
            c.notes,
            c.quotes,
            c.readingStatus
          )
        )
      );

      if (citations.some((c) => c.sortOrder !== undefined)) {
        await reorderCitations(newList.id, newCitations.map((c) => c.id));
      }

      return NextResponse.json({
        success: true,
        data: { type: "list", id: newList.id, name: newList.name },
      });
    }

    if (shareLink.type === "project") {
      const originalProject = await findProjectById(shareLink.targetId);
      if (!originalProject) {
        return NextResponse.json(
          { success: false, error: "Original project not found" },
          { status: 404 }
        );
      }

      const originalLists = await getProjectLists(originalProject.userId, shareLink.targetId);
      const newProject = await createProject(userId, originalProject.name, originalProject.description);

      await Promise.all(
        originalLists.map(async (list) => {
          const citations = await getListCitations(list.id);
          const newList = await createList(userId, list.name, newProject.id, list.description);
          const newCitations = await Promise.all(
            citations.map((c) =>
              addCitation(
                newList.id,
                c.fields,
                c.style,
                c.formattedText,
                c.formattedHtml,
                c.tags,
                c.notes,
                c.quotes,
                c.readingStatus
              )
            )
          );
          if (citations.some((c) => c.sortOrder !== undefined)) {
            await reorderCitations(newList.id, newCitations.map((c) => c.id));
          }
        })
      );

      return NextResponse.json({
        success: true,
        data: { type: "project", id: newProject.id, name: newProject.name },
      });
    }

    return NextResponse.json(
      { success: false, error: "Unknown share type" },
      { status: 400 }
    );
  } catch (err) {
    console.error("Clone share error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to save to your account" },
      { status: 500 }
    );
  }
}
