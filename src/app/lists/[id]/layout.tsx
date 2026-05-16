import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Citation List — OpenCitation",
  description: "View and manage a citation list.",
};

export default function ListLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
