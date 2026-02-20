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
};

export default nextConfig;
