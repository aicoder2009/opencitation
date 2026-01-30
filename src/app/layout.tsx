import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { PWAProvider } from "@/components/pwa/pwa-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenCitation - Free Citation Generator",
  description: "Generate, organize, and share citations in APA, MLA, Chicago, and Harvard formats. Free, open source, no account required.",
  keywords: ["citation generator", "APA", "MLA", "Chicago", "Harvard", "bibliography", "references", "free", "open source"],
  authors: [{ name: "OpenCitation" }],
  creator: "OpenCitation",
  publisher: "OpenCitation",
  metadataBase: new URL("https://opencitation.vercel.app"),
  applicationName: "OpenCitation",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "OpenCitation",
  },
  formatDetection: {
    telephone: false,
  },
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
        alt: "OpenCitation - Free and Open Source Citation Generator",
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
    icon: [
      { url: "/icon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#3366cc",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
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
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="OpenCitation" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/apple-icon.png" />
          <link rel="apple-touch-startup-image" href="/icons/icon-512.png" />
        </head>
        <body className="antialiased">
          <PWAProvider>
            {children}
          </PWAProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
