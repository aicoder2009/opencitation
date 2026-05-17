import type { Metadata } from "next";
import { getShareLink, findListById, findProjectById, getListCitations, getUserLists } from "@/lib/db";
import { parseShareSegment } from "@/lib/share-utils";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ code: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code: segment } = await params;
  const { code } = parseShareSegment(segment);

  let title = "Shared bibliography — OpenCitation";
  let description =
    "View a citation list shared via OpenCitation. No account needed.";

  try {
    const shareLink = await getShareLink(code);
    if (shareLink) {
      if (shareLink.type === "list") {
        const [listData, citations] = await Promise.all([
          findListById(shareLink.targetId),
          getListCitations(shareLink.targetId),
        ]);
        if (listData) {
          title = `${listData.name} — OpenCitation`;
          description = `Shared citation list with ${citations.length} entr${citations.length === 1 ? "y" : "ies"}.`;
        }
      } else {
        const [projectData, allLists] = await Promise.all([
          findProjectById(shareLink.targetId),
          getUserLists(shareLink.userId),
        ]);
        if (projectData) {
          const projectLists = allLists.filter((l) => l.projectId === shareLink.targetId);
          title = `${projectData.name} — OpenCitation`;
          description = `Shared citation project with ${projectLists.length} list${projectLists.length === 1 ? "" : "s"}.`;
        }
      }
    }
  } catch {
    // fall through to defaults
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function ShareLayout({ children }: LayoutProps) {
  return children;
}
