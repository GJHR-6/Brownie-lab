import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Default es 1mb — el bucket product-images permite hasta 10mb
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "qktwbasgiwkconmwiwwk.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;
