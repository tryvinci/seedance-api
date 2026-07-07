import type { CreditPack, ModelDefinition, PriceUnit } from "./types";

/** Internal ledger unit: 1 credit = $0.01 */
export function usdToCredits(priceUsd: number): number {
  return Math.round(priceUsd * 100);
}

export function creditsToUsd(credits: number): number {
  return Math.round(credits) / 100;
}

export function formatUsd(priceUsd: number): string {
  return `$${priceUsd.toFixed(2)}`;
}

export function formatPrice(priceUsd: number, unit: PriceUnit): string {
  return unit === "second"
    ? `${formatUsd(priceUsd)}/sec`
    : `${formatUsd(priceUsd)}/gen`;
}

export function priceUnitLabel(unit: PriceUnit): string {
  return unit === "second" ? "per second" : "per generation";
}

/** Charge in credits for a request. Video bills by duration (seconds). */
export function chargeCredits(
  model: ModelDefinition,
  opts?: { duration?: number },
): number {
  if (model.priceUnit === "second") {
    const duration = Math.max(1, opts?.duration ?? 5);
    return usdToCredits(model.priceUsd * duration);
  }
  return usdToCredits(model.priceUsd);
}

export function chargeUsd(
  model: ModelDefinition,
  opts?: { duration?: number },
): number {
  return creditsToUsd(chargeCredits(model, opts));
}

/** Markup over upstream provider cost, by model tier. */
export function providerMarkup(model: ModelDefinition): number {
  if (model.kind === "image") return 0.1;
  if (model.family === "seedance-2.5") return 0.3;
  return 0.15;
}

/** Round USD up to the nearest cent ($0.01). */
export function roundUpUsd(usd: number): number {
  return Math.ceil(usd * 100) / 100;
}

export function retailCreditsFromCosts(
  model: ModelDefinition,
  catalogCredits: number,
  providerCostUsd: number | null,
): {
  retailCredits: number;
  retailUsd: number;
  marginUsd: number | null;
  markup: number | null;
} {
  const catalogUsd = creditsToUsd(catalogCredits);
  if (providerCostUsd == null || providerCostUsd <= 0) {
    return {
      retailCredits: catalogCredits,
      retailUsd: catalogUsd,
      marginUsd: null,
      markup: null,
    };
  }
  const markup = providerMarkup(model);
  const minRetailUsd = roundUpUsd(providerCostUsd * (1 + markup));
  const retailUsd = roundUpUsd(Math.max(catalogUsd, minRetailUsd));
  const retailCredits = usdToCredits(retailUsd);
  return {
    retailCredits,
    retailUsd,
    marginUsd: Math.round((retailUsd - providerCostUsd) * 100) / 100,
    markup,
  };
}

/** User-facing price: what you pay, plus an optional higher reference price. */
export interface PublicPrice {
  priceUsd: number;
  compareAtUsd: number | null;
}

export function buildPublicPrice(
  model: ModelDefinition,
  catalogCredits: number,
  providerCostUsd: number | null,
  providerListCostUsd?: number | null,
): PublicPrice & {
  retailCredits: number;
  marginUsd: number | null;
  markup: number | null;
} {
  const retail = retailCreditsFromCosts(model, catalogCredits, providerCostUsd);
  if (providerCostUsd == null || providerCostUsd <= 0) {
    return {
      priceUsd: retail.retailUsd,
      compareAtUsd: null,
      retailCredits: retail.retailCredits,
      marginUsd: retail.marginUsd,
      markup: retail.markup,
    };
  }

  const markup = providerMarkup(model);
  const catalogUsd = creditsToUsd(catalogCredits);
  const listCostUsd = Math.max(
    providerListCostUsd ?? providerCostUsd,
    providerCostUsd,
  );
  const referenceUsd = roundUpUsd(
    Math.max(catalogUsd, roundUpUsd(listCostUsd * (1 + markup))),
  );
  const compareAtUsd =
    referenceUsd > retail.retailUsd ? referenceUsd : null;

  return {
    priceUsd: retail.retailUsd,
    compareAtUsd,
    retailCredits: retail.retailCredits,
    marginUsd: retail.marginUsd,
    markup: retail.markup,
  };
}

/** Prepaid balance packs (USD). Credits stored as cents. */
export const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", name: "Starter", credits: usdToCredits(5), priceUsd: 5 },
  { id: "builder", name: "Builder", credits: usdToCredits(20), priceUsd: 20 },
  { id: "pro", name: "Pro", credits: usdToCredits(70), priceUsd: 70 },
  { id: "scale", name: "Scale", credits: usdToCredits(300), priceUsd: 300 },
];
