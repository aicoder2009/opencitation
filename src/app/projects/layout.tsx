import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Projects — OpenCitation",
  description: "Manage and organize your citation projects.",
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
