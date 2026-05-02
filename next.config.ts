import type { NextConfig } from "next";

const baseSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(self), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.clerk.com",
      },
      {
        protocol: "https",
        hostname: "images.clerk.dev",
      },
    ],
  },
  async headers() {
    return [
      {
        // Default headers — applied to every page that isn't designed to be embedded.
        source: "/((?!embed|api/badge).*)",
        headers: [
          ...baseSecurityHeaders,
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
      {
        // /embed and /api/badge are intentionally embeddable from third-party sites,
        // so they get the safe headers but not X-Frame-Options.
        source: "/(embed|api/badge)(.*)",
        headers: baseSecurityHeaders,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://us-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
