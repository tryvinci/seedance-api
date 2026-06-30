import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/api/"],
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/docs", "/llms.txt", "/llms-full.txt", "/models"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/docs", "/llms.txt", "/llms-full.txt", "/models"],
      },
      {
        userAgent: "ClaudeBot",
        allow: ["/", "/docs", "/llms.txt", "/llms-full.txt", "/models"],
      },
    ],
    sitemap: "https://seedanceapi.us/sitemap.xml",
  };
}
