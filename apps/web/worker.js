import openNextHandler from "./.open-next/worker.js";

/**
 * Proxies /docs/* to Mintlify for subpath hosting on seedanceapi.us/docs.
 * Set MINTLIFY_DOCS_HOST in wrangler (e.g. seedance-api.mintlify.app).
 */
async function proxyMintlifyDocs(request, env) {
  const mintlifyHost = env.MINTLIFY_DOCS_HOST;
  const customDomain = env.CUSTOM_DOMAIN ?? "seedanceapi.us";

  if (!mintlifyHost) {
    return new Response("Docs proxy not configured (MINTLIFY_DOCS_HOST)", {
      status: 503,
    });
  }

  const url = new URL(request.url);
  url.hostname = mintlifyHost;
  url.protocol = "https:";

  const proxyRequest = new Request(url, request);
  proxyRequest.headers.set("Host", mintlifyHost);
  proxyRequest.headers.set("X-Forwarded-Host", customDomain);
  proxyRequest.headers.set("X-Forwarded-Proto", "https");

  const clientIp = request.headers.get("CF-Connecting-IP");
  if (clientIp) {
    proxyRequest.headers.set("CF-Connecting-IP", clientIp);
  }

  return fetch(proxyRequest);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/.well-known/")) {
      return openNextHandler.fetch(request, env, ctx);
    }

    if (/^\/docs(\/|$)/.test(url.pathname)) {
      return proxyMintlifyDocs(request, env);
    }

    return openNextHandler.fetch(request, env, ctx);
  },
};
