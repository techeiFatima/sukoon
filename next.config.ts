import type { NextConfig } from "next";

// Security headers. Sukoon ships no analytics or ad trackers; the CSP below
// only allows our own origin plus the configured Supabase project.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const connectSrc = ["'self'", supabaseUrl, supabaseUrl.replace(/^http/, "ws")]
  .filter(Boolean)
  .join(" ");

const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://i.ytimg.com",
  // Lectures play in YouTube's privacy-enhanced player only.
  "frame-src https://www.youtube-nocookie.com",
  "font-src 'self' data:",
  `connect-src ${connectSrc}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
