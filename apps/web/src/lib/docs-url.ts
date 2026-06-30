export function getDocsUrl(path = "") {
  const base =
    process.env.NEXT_PUBLIC_DOCS_URL ?? "https://docs.seedanceapi.us";
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${base.replace(/\/$/, "")}${normalized}`;
}
