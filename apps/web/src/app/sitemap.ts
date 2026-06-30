import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://seedanceapi.us";
  const docsBase = process.env.NEXT_PUBLIC_DOCS_URL ?? "https://seedanceapi.us/docs";

  const marketingPages = ["", "/models", "/pricing", "/agents", "/llms.txt", "/llms-full.txt"];
  const docsPages = [
    "",
    "/quickstart",
    "/authentication",
    "/videos",
    "/images",
    "/models",
    "/errors",
    "/agents",
  ];

  return [
    ...marketingPages.map((path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: (path === "" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: path === "" ? 1 : 0.8,
    })),
    ...docsPages.map((path) => ({
      url: `${docsBase.replace(/\/$/, "")}${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: path === "" ? 0.9 : 0.7,
    })),
  ];
}
