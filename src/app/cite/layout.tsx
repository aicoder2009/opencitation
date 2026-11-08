import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate Citation — OpenCitation",
  description: "Generate properly formatted citations from URLs, DOIs, ISBNs, PubMed IDs, arXiv IDs, and Wikipedia. Supports APA, MLA, Chicago, Harvard, and more.",
  openGraph: {
    title: "Generate Citation — OpenCitation",
    description: "Generate properly formatted citations from URLs, DOIs, ISBNs, PubMed IDs, arXiv IDs, and Wikipedia. Supports APA, MLA, Chicago, Harvard, and more.",
    url: "https://opencitation.vercel.app/cite",
    type: "website",
  },
};

export default function CiteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
