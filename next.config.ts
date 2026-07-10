import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "raw.githubusercontent.com", pathname: "/shagaofeng-rgb/grimmfirepump.cl/**" }] },
};

export default nextConfig;
