import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenCitation - Free Citation Generator",
  description: "Generate, organize, and share citations in APA, MLA, Chicago, and Harvard formats. Free, open source, no account required.",
  keywords: ["citation generator", "APA", "MLA", "Chicago", "Harvard", "bibliography", "references", "free", "open source"],
  authors: [{ name: "OpenCitation" }],
  creator: "OpenCitation",
  publisher: "OpenCitation",
  metadataBase: new URL("https://opencitation.vercel.app"),
  openGraph: {
    title: "OpenCitation - Free Citation Generator",
    description: "Generate, organize, and share citations in APA, MLA, Chicago, and Harvard formats. Free, open source, no account required.",
    url: "https://opencitation.vercel.app",
    siteName: "OpenCitation",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OpenCitation - Free Citation Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenCitation - Free Citation Generator",
    description: "Generate, organize, and share citations in APA, MLA, Chicago, and Harvard formats. Free, open source, no account required.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <meta name="theme-color" content="#3366cc" />
          <link rel="manifest" href="/manifest.json" />
        </head>
        <body className="antialiased">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
