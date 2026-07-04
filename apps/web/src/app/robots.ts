import type { MetadataRoute } from "next";

const AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "ClaudeBot",
  "anthropic-ai",
  "Google-Extended",
  "Googlebot",
  "PerplexityBot",
  "Applebot-Extended",
  "Amazonbot",
  "Bytespider",
  "meta-externalagent",
  "CCBot",
];

const publicPaths = [
  "/",
  "/docs",
  "/docs/",
  "/models",
  "/pricing",
  "/agents",
  "/llms.txt",
  "/llms-full.txt",
  "/openapi.json",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/playground", "/sign-in", "/sign-up", "/api/"],
      },
      ...AI_BOTS.map((userAgent) => ({
        userAgent,
        allow: publicPaths,
        disallow: ["/dashboard", "/playground", "/sign-in", "/sign-up", "/api/"],
      })),
    ],
    sitemap: "https://seedanceapi.us/sitemap.xml",
    host: "https://seedanceapi.us",
  };
}
