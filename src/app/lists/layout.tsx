import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Lists — OpenCitation",
  description: "Manage and organize your citation lists.",
};

export default function ListsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
