import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@social-media/database", "@social-media/types"],
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;
