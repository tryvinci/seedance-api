import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWalletBalance } from "@seedance/db";
import { creditsToUsd } from "@seedance/models";
import { ensureDefaultApiKey } from "@/lib/ensure-default-api-key";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let balanceUsd = 0;
  let balanceCredits = 0;
  try {
    const db = await getDb();
    balanceCredits = await getWalletBalance(db, userId);
    balanceUsd = creditsToUsd(balanceCredits);
  } catch (err) {
    console.error("Account bootstrap balance failed:", err);
    return NextResponse.json(
      { error: "Failed to load balance" },
      { status: 500 },
    );
  }

  // API key provisioning must not fail the whole bootstrap (Clerk API Keys EA).
  let key: {
    secret: string | null;
    name: string | null;
    created: boolean;
  } = { secret: null, name: null, created: false };
  try {
    key = await ensureDefaultApiKey(userId);
  } catch (err) {
    console.error("Account bootstrap API key failed:", err);
  }

  return NextResponse.json({
    balance_usd: balanceUsd,
    balance_credits: balanceCredits,
    default_api_key: key.secret,
    default_api_key_name: key.name,
    default_api_key_created: key.created,
  });
}
