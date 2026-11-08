import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Lists — OpenCitation",
  description: "Organize your citations into lists and bibliographies. Share, export as BibTeX, RIS, or plain text.",
  openGraph: {
    title: "My Lists — OpenCitation",
    description: "Organize your citations into lists and bibliographies. Share, export as BibTeX, RIS, or plain text.",
    url: "https://opencitation.vercel.app/lists",
    type: "website",
  },
};

export default function ListsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
