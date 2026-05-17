"use client";

import { use, useEffect, useState } from "react";
import DOMPurify from "isomorphic-dompurify";
import { parseShareSegment } from "@/lib/share-utils";

interface SharedCitation {
  id: string;
  style: string;
  formattedText: string;
  formattedHtml: string;
  createdAt: string;
}

interface SharedList {
  id: string;
  name: string;
  citations: SharedCitation[];
}

interface SharedData {
  type: "list" | "project";
  id: string;
  name: string;
  description?: string;
  citations?: SharedCitation[];
  lists?: SharedList[];
}

// Chrome-free version of the share page suitable for iframe embedding.
// Accepts query params:
//   ?theme=light|dark
//   ?numbered=1            (numbered list rather than bullets)
//   ?title=0               (hide the list/project name)
export default function ShareEmbedPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: segment } = use(params);
  const { code } = parseShareSegment(segment);

  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Parse query options once on mount.
  const [opts, setOpts] = useState<{
    theme: "light" | "dark";
    numbered: boolean;
    showTitle: boolean;
  }>({ theme: "light", numbered: false, showTitle: true });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URL(window.location.href).searchParams;
    setOpts({
      theme: q.get("theme") === "dark" ? "dark" : "light",
      numbered: q.get("numbered") === "1" || q.get("numbered") === "true",
      showTitle: q.get("title") !== "0" && q.get("title") !== "false",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/share/${code}`);
        const result = await res.json();
        if (cancelled) return;
        if (result.success) setData(result.data);
        else setError(result.error || "Share not found");
      } catch {
        if (!cancelled) setError("Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const isDark = opts.theme === "dark";
  const palette = isDark
    ? { bg: "#101418", text: "#eaecf0", muted: "#a2a9b1", border: "#54595d" }
    : { bg: "#ffffff", text: "#202122", muted: "#54595d", border: "#cccccc" };

  const containerStyle: React.CSSProperties = {
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: 14,
    lineHeight: 1.6,
    background: palette.bg,
    color: palette.text,
    padding: 16,
    margin: 0,
    minHeight: "100vh",
  };

  if (loading) {
    return <div style={{ ...containerStyle, color: palette.muted }}>Loading…</div>;
  }
  if (error || !data) {
    return (
      <div style={{ ...containerStyle, color: palette.muted }}>
        {error || "Not found"}
      </div>
    );
  }

  const citations =
    data.type === "list"
      ? data.citations ?? []
      : (data.lists ?? []).flatMap((l) => l.citations);

  const ListTag = opts.numbered ? "ol" : "ul";

  return (
    <div style={containerStyle} className={isDark ? "dark" : ""}>
      {opts.showTitle && (
        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            margin: "0 0 12px 0",
            borderBottom: `1px solid ${palette.border}`,
            paddingBottom: 6,
          }}
        >
          {data.name}
        </h1>
      )}
      <ListTag
        style={{
          margin: 0,
          paddingLeft: opts.numbered ? 24 : 16,
          listStyleType: opts.numbered ? "decimal" : "disc",
        }}
      >
        {citations.map((c) => (
          <li
            key={c.id}
            style={{
              marginBottom: 10,
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: 13,
              wordBreak: "break-word",
            }}
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(c.formattedHtml || c.formattedText),
            }}
          />
        ))}
      </ListTag>
      <p
        style={{
          marginTop: 16,
          fontSize: 11,
          color: palette.muted,
          textAlign: "right",
        }}
      >
        <a
          href={`/share/${segment}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: palette.muted }}
        >
          via opencitation
        </a>
      </p>
    </div>
  );
}
