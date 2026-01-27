import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@fieldvantage/shared", "@fieldvantage/data"]
};

export default nextConfig;
