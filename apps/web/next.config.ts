import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use standalone only when not on non-elevated Windows symlink systems
  ...(process.platform !== "win32" ? { output: "standalone" } : {}),
};

export default nextConfig;
