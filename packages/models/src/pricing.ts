import type { CreditPack } from "./types";

export const CREDIT_PACKS: CreditPack[] = [
  { id: "starter", name: "Starter", credits: 500, priceUsd: 5 },
  { id: "builder", name: "Builder", credits: 2500, priceUsd: 20 },
  { id: "pro", name: "Pro", credits: 10000, priceUsd: 70 },
  { id: "scale", name: "Scale", credits: 50000, priceUsd: 300 },
];

export function creditsToUsd(credits: number): number {
  return Math.round((credits / 100) * 100) / 100;
}
