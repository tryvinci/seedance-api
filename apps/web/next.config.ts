import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    // Local dev only — production uses the Cloudflare worker /docs proxy to Mintlify.
    if (process.env.NODE_ENV !== "development") {
      return [];
    }

    const docsDev =
      process.env.NEXT_PUBLIC_DOCS_URL ?? "http://localhost:3333";
    const base = docsDev.replace(/\/$/, "");

    return [
      {
        source: "/docs",
        destination: base,
        permanent: false,
      },
      {
        source: "/docs/:path*",
        destination: `${base}/:path*`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
