#!/usr/bin/env node
/**
 * Verify WaveSpeed pricing quotes for catalog models.
 *
 * Usage:
 *   WAVESPEED_API_KEY=wsk_... node scripts/verify-wavespeed-pricing.mjs
 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

let catalog;
let providers;
try {
  catalog = await import("@seedance/models");
  providers = await import("@seedance/providers");
} catch {
  console.error("Run from repo root with workspace deps installed.");
  process.exit(1);
}

const key = process.env.WAVESPEED_API_KEY?.trim();
if (!key) {
  console.error("Set WAVESPEED_API_KEY");
  process.exit(1);
}

const { listModels, chargeUsd } = catalog;
const { quoteGeneration } = providers;

const config = {
  modelarkApiKey: "",
  wavespeedApiKey: key,
  arkBase: "https://ark.ap-southeast.bytepluses.com",
};

const keys = { modelark: false, wavespeed: true };
const models = listModels({ providers: keys }).filter((m) => m.kind === "video");

let failed = 0;
for (const model of models.slice(0, 5)) {
  const params = {
    prompt: "pricing probe",
    duration: 15,
    aspect_ratio: "16:9",
    resolution: "720p",
    image_url: "https://example.com/ref.jpg",
  };
  try {
    const quote = await quoteGeneration(config, model.id, params, keys);
    const catalogUsd = chargeUsd(model, { duration: 15 });
    const loss = quote.providerCostUsd != null && quote.retailUsd < quote.providerCostUsd;
    console.log(
      `${loss ? "LOSS" : "OK  "} ${model.id} catalog=$${catalogUsd.toFixed(2)} provider=$${quote.providerCostUsd?.toFixed(2)} retail=$${quote.retailUsd.toFixed(2)} path=${quote.providerModelPath}`,
    );
    if (loss) failed += 1;
  } catch (err) {
    failed += 1;
    console.error(`FAIL ${model.id}:`, err instanceof Error ? err.message : err);
  }
}

if (failed > 0) process.exit(1);
console.log("\nPricing quotes look profitable.");
