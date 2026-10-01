import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Lets other devices (e.g. your phone on the same Wi-Fi) use the dev server.
  // Set DEV_ALLOWED_ORIGINS in .env.local to a comma-separated list of hostnames/IPs.
  allowedDevOrigins: (process.env.DEV_ALLOWED_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean),
};

export default nextConfig;
