import type { NextConfig } from "next";
import pkg from "./package.json" with { type: "json" };

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@fieldvantage/shared", "@fieldvantage/data"],
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_BUILD_DATE: new Date().toISOString(),
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV ?? "development",
  },
  // Allow local subdomain testing: add "127.0.0.1 app.localhost" to your hosts file
  // and access http://app.localhost:3000 to simulate app.geklix.com locally
  allowedDevOrigins: ["app.localhost"],
};

export default nextConfig;
