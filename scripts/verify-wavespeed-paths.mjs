#!/usr/bin/env node
/**
 * Probe WaveSpeed model paths from the catalog.
 *
 * Usage:
 *   WAVESPEED_API_KEY=wsk_... node scripts/verify-wavespeed-paths.mjs
 *
 * Exit code 1 if any primary path is missing and has no working fallback.
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

// Resolve workspace package (built or ts via tsx). Prefer running with:
//   pnpm exec tsx scripts/verify-wavespeed-paths.mjs
// when TypeScript source is used.
let catalog;
try {
  catalog = await import("@seedance/models");
} catch {
  console.error("Run from repo root with workspace deps installed.");
  process.exit(1);
}

const key = process.env.WAVESPEED_API_KEY?.trim();
if (!key) {
  console.error("Set WAVESPEED_API_KEY");
  process.exit(1);
}

const { listModels, getWavespeedPaths } = catalog;
const models = listModels();
let failed = 0;

for (const model of models) {
  const paths = getWavespeedPaths(model);
  if (paths.length === 0) continue;

  let okPath = null;
  for (const path of paths) {
    const res = await fetch(`https://api.wavespeed.ai/api/v3/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: "path check",
        size: "2048*2048",
        duration: 5,
        aspect_ratio: "16:9",
      }),
    });
    const text = await res.text();
    const missing =
      res.status === 404 ||
      /model not found|unknown model|does not exist/i.test(text);
    if (!missing && (res.ok || res.status === 400)) {
      // 400 for missing required media is still "path exists"
      okPath = path;
      break;
    }
  }

  if (okPath) {
    const primary = paths[0] === okPath ? "primary" : `fallback:${okPath}`;
    console.log(`OK  ${model.id} (${primary})`);
  } else {
    failed += 1;
    console.error(`FAIL ${model.id} paths=${paths.join(", ")}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} model(s) have no working WaveSpeed path.`);
  process.exit(1);
}
console.log("\nAll WaveSpeed paths resolved.");
