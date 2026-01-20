import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenCitation - Free Citation Generator",
  description: "Generate, organize, and share citations in APA, MLA, Chicago, and Harvard formats",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
