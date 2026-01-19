import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Remove 'standalone' output for Vercel - it's only needed for Docker deployments
};

export default withNextIntl(nextConfig);
