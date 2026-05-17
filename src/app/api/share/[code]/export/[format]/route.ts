import { NextRequest, NextResponse } from "next/server";
import {
  getShareLink,
  findListById,
  findProjectById,
  getListCitations,
  getUserLists,
} from "@/lib/db";
import { parseShareSegment } from "@/lib/share-utils";
import { verifySharePassword } from "@/lib/share-password";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import {
  toBibTeXMultiple,
  toRISMultiple,
  toMarkdown,
  toHTML,
  toCSLJSON,
  toRTF,
} from "@/lib/citation/exporters";

type Format = "bib" | "ris" | "txt" | "md" | "html" | "rtf" | "csl-json";

const FORMATS: Record<
  Format,
  { mime: string; ext: string }
> = {
  bib: { mime: "application/x-bibtex; charset=utf-8", ext: "bib" },
  ris: { mime: "application/x-research-info-systems; charset=utf-8", ext: "ris" },
  txt: { mime: "text/plain; charset=utf-8", ext: "txt" },
  md: { mime: "text/markdown; charset=utf-8", ext: "md" },
  html: { mime: "text/html; charset=utf-8", ext: "html" },
  rtf: { mime: "application/rtf", ext: "rtf" },
  "csl-json": { mime: "application/json; charset=utf-8", ext: "json" },
};

// Rate-limit: 10 burst, refill 1/sec ⇒ ~60/min, tighter than the read.
const EXPORT_RATE = { capacity: 10, refillRatePerMs: 1 / 1000 };

function safeFilename(name: string, ext: string): string {
  const cleaned = name.replace(/[^a-z0-9-_ ]/gi, "_").trim() || "citations";
  return `${cleaned}.${ext}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; format: string }> },
) {
  const { code: segment, format: rawFormat } = await params;
  const { code } = parseShareSegment(segment);
  const format = rawFormat.toLowerCase() as Format;

  if (!(format in FORMATS)) {
    return NextResponse.json(
      { success: false, error: "Unsupported export format" },
      { status: 400 },
    );
  }

  const rl = checkRateLimit(`share-export:${clientKey(request)}:${code}`, EXPORT_RATE);
  if (!rl.ok) {
    return NextResponse.json(
      { success: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  const shareLink = await getShareLink(code);
  if (!shareLink) {
    return NextResponse.json(
      { success: false, error: "Share link not found or expired" },
      { status: 404 },
    );
  }

  if (shareLink.passwordHash) {
    const candidate = request.headers.get("x-share-password");
    if (!candidate || !verifySharePassword(candidate, shareLink.passwordHash)) {
      return NextResponse.json(
        { success: false, error: "Password required", requiresPassword: true },
        { status: 401 },
      );
    }
  }

  // Gather citations + a display name. Exports never increment viewCount
  // — that's reserved for human page views.
  let displayName: string;
  let citations: Awaited<ReturnType<typeof getListCitations>>;
  if (shareLink.type === "list") {
    const [listData, listCits] = await Promise.all([
      findListById(shareLink.targetId),
      getListCitations(shareLink.targetId),
    ]);
    if (!listData) {
      return NextResponse.json(
        { success: false, error: "The shared list is no longer available." },
        { status: 410 },
      );
    }
    displayName = listData.name;
    citations = listCits;
  } else {
    const [projectData, allLists] = await Promise.all([
      findProjectById(shareLink.targetId),
      getUserLists(shareLink.userId),
    ]);
    if (!projectData) {
      return NextResponse.json(
        { success: false, error: "The shared project is no longer available." },
        { status: 410 },
      );
    }
    displayName = projectData.name;
    const projectLists = allLists.filter((l) => l.projectId === shareLink.targetId);
    const perList = await Promise.all(projectLists.map((l) => getListCitations(l.id)));
    citations = perList.flat();
  }

  let body: string;
  switch (format) {
    case "bib":
      body = toBibTeXMultiple(citations.map((c) => c.fields));
      break;
    case "ris":
      body = toRISMultiple(citations.map((c) => c.fields));
      break;
    case "md":
      body = toMarkdown(citations, displayName);
      break;
    case "html":
      body = toHTML(citations, displayName);
      break;
    case "rtf":
      body = toRTF(citations, displayName);
      break;
    case "csl-json":
      body = JSON.stringify(toCSLJSON(citations.map((c) => c.fields)), null, 2);
      break;
    case "txt":
    default:
      body = citations.map((c) => c.formattedText).join("\n\n");
      break;
  }

  const meta = FORMATS[format];
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": meta.mime,
      "Content-Disposition": `attachment; filename="${safeFilename(displayName, meta.ext)}"`,
      "Cache-Control": "public, max-age=60, must-revalidate",
    },
  });
}
