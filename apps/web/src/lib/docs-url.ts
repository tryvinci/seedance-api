const DOCS_BASE =
  process.env.NEXT_PUBLIC_DOCS_URL ?? "https://seedanceapi.us/docs";

export function getDocsUrl(path = "") {
  const base = DOCS_BASE.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : path ? `/${path}` : "";
  return `${base}${normalized}`;
}
