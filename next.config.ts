import type { NextConfig } from "next";

/**
 * Security headers (spec §34). HSTS is added by Vercel in production.
 * The app never needs to be framed, never loads cross-origin scripts, and
 * has no use for the browser sensors listed in Permissions-Policy.
 */
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
