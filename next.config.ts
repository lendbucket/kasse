import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Required for Next.js 16 Turbopack — acknowledges webpack config added by
  // @sentry/nextjs withSentryConfig wrapper. Sentry source map upload uses
  // webpack plugins, which are skipped under Turbopack; core error capture
  // still works via the sentry.*.config.ts side-effect files.
  turbopack: {},
};

const sentryWebpackPluginOptions = {
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Only upload source maps in production builds
  disableServerWebpackPlugin: process.env.VERCEL_ENV !== "production",
  disableClientWebpackPlugin: process.env.VERCEL_ENV !== "production",
  hideSourceMaps: true,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
