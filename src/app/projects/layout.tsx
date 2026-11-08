import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Projects — OpenCitation",
  description: "Group your citation lists into projects — one project per paper, thesis, or course.",
  openGraph: {
    title: "My Projects — OpenCitation",
    description: "Group your citation lists into projects — one project per paper, thesis, or course.",
    url: "https://opencitation.vercel.app/projects",
    type: "website",
  },
};

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
