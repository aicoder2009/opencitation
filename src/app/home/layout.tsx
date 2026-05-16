import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "OpenCitation — Free Citation Generator",
  description: "Generate, organize, and share citations in APA, MLA, Chicago, and Harvard formats. Free, open source, no account required.",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
