import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    const backendApiUrl = process.env.BACKEND_API_URL ?? "http://localhost:4000/api";
    const backendOrigin = backendApiUrl.replace(/\/api\/?$/, "");

    return [
      {
        source: "/uploads/:path*",
        destination: `${backendOrigin}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
