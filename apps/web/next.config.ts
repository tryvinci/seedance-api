import type { NextConfig } from "next";

const docsUrl = process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.seedanceapi.us";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/docs",
        destination: docsUrl,
        permanent: false,
      },
      {
        source: "/docs/:path*",
        destination: `${docsUrl}/:path*`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
