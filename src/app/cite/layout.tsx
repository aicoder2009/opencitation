import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generate Citation — OpenCitation",
  description: "Generate citations from URLs, DOIs, ISBNs, PubMed IDs, arXiv IDs, and more.",
};

export default function CiteLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
