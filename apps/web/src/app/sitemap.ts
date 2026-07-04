import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://seedanceapi.us";
  const docsBase = "https://seedanceapi.us/docs";

  const marketingPages: { path: string; priority: number; freq: "weekly" | "monthly" }[] = [
    { path: "", priority: 1, freq: "weekly" },
    { path: "/models", priority: 0.9, freq: "weekly" },
    { path: "/pricing", priority: 0.9, freq: "weekly" },
    { path: "/agents", priority: 0.8, freq: "monthly" },
    { path: "/privacy", priority: 0.3, freq: "monthly" },
    { path: "/terms", priority: 0.3, freq: "monthly" },
    { path: "/refunds", priority: 0.3, freq: "monthly" },
    { path: "/llms.txt", priority: 0.7, freq: "weekly" },
    { path: "/llms-full.txt", priority: 0.6, freq: "weekly" },
    { path: "/openapi.json", priority: 0.5, freq: "monthly" },
  ];

  const docsPages = [
    "",
    "/quickstart",
    "/authentication",
    "/videos",
    "/images",
    "/media",
    "/models",
    "/errors",
    "/agents",
    "/api-reference/introduction",
  ];

  return [
    ...marketingPages.map(({ path, priority, freq }) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: freq,
      priority,
    })),
    ...docsPages.map((path) => ({
      url: `${docsBase}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === "" ? 0.9 : 0.7,
    })),
  ];
}
