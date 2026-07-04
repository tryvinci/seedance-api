import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { ensureWallet, getWalletBalance } from "@seedance/db";
import { creditsToUsd } from "@seedance/models";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ensureDefaultApiKey } from "@/lib/ensure-default-api-key";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = drizzle(env.DB);
    await ensureWallet(db, userId);
    const balance = await getWalletBalance(db, userId);
    const key = await ensureDefaultApiKey(userId);

    return NextResponse.json({
      balance_usd: creditsToUsd(balance),
      default_api_key: key.secret,
      default_api_key_name: key.name,
      default_api_key_created: key.created,
    });
  } catch (err) {
    console.error("Account bootstrap failed:", err);
    return NextResponse.json(
      { error: "Failed to provision account" },
      { status: 500 },
    );
  }
}
