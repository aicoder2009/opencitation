import { ImageResponse } from "next/og";
import {
  getShareLink,
  findListById,
  findProjectById,
  getListCitations,
  getUserLists,
} from "@/lib/db";
import { parseShareSegment } from "@/lib/share-utils";

export const runtime = "nodejs";
export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

export default async function ShareOgImage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: segment } = await params;
  const { code } = parseShareSegment(segment);

  // Resolve share. On any failure we still render *something* rather than
  // 404'ing the OG image — broken previews look worse than a generic card.
  let title = "Shared bibliography";
  let subtitle = "OpenCitation";
  let citationCount = 0;

  try {
    const shareLink = await getShareLink(code);
    if (shareLink) {
      if (shareLink.type === "list") {
        const [listData, citations] = await Promise.all([
          findListById(shareLink.targetId),
          getListCitations(shareLink.targetId),
        ]);
        if (listData) title = listData.name;
        citationCount = citations.length;
        subtitle = `Shared list · ${citationCount} citation${citationCount === 1 ? "" : "s"}`;
      } else {
        const [projectData, allLists] = await Promise.all([
          findProjectById(shareLink.targetId),
          getUserLists(shareLink.userId),
        ]);
        if (projectData) title = projectData.name;
        const projectLists = allLists.filter((l) => l.projectId === shareLink.targetId);
        const counts = await Promise.all(projectLists.map((l) => getListCitations(l.id)));
        citationCount = counts.reduce((s, arr) => s + arr.length, 0);
        subtitle = `Shared project · ${projectLists.length} list${projectLists.length === 1 ? "" : "s"} · ${citationCount} citation${citationCount === 1 ? "" : "s"}`;
      }
    }
  } catch {
    // fall through with defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#f8f8f8",
          color: "#202122",
          fontFamily: "Arial, Helvetica, sans-serif",
          display: "flex",
          flexDirection: "column",
          padding: 64,
          border: "8px solid #aaaaaa",
        }}
      >
        <div
          style={{
            fontSize: 28,
            color: "#54595d",
            marginBottom: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span style={{ fontWeight: 700, color: "#0645ad" }}>OpenCitation</span>
          <span>·</span>
          <span>{subtitle}</span>
        </div>

        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            lineHeight: 1.1,
            marginBottom: 24,
            color: "#202122",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 24,
            color: "#54595d",
            borderTop: "1px solid #cccccc",
            paddingTop: 24,
          }}
        >
          <span>opencitation.org</span>
          <span style={{ fontFamily: "Courier New, monospace" }}>/share/{segment.length > 32 ? `${segment.slice(0, 32)}…` : segment}</span>
        </div>
      </div>
    ),
    size,
  );
}
