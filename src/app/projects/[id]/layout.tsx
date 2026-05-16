import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project — OpenCitation",
  description: "View and manage a citation project.",
};

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
