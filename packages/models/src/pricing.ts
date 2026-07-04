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

/** Prepaid balance packs (USD). Credits stored as cents. */
export const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", name: "Starter", credits: usdToCredits(5), priceUsd: 5 },
  { id: "builder", name: "Builder", credits: usdToCredits(20), priceUsd: 20 },
  { id: "pro", name: "Pro", credits: usdToCredits(70), priceUsd: 70 },
  { id: "scale", name: "Scale", credits: usdToCredits(300), priceUsd: 300 },
];
