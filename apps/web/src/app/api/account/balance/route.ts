import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getWalletBalance } from "@seedance/db";
import { creditsToUsd } from "@seedance/models";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const balance = await getWalletBalance(db, userId);
    return NextResponse.json({
      balance_usd: creditsToUsd(balance),
      balance_credits: balance,
    });
  } catch (err) {
    console.error("Balance read failed:", err);
    return NextResponse.json(
      { error: "Failed to load balance" },
      { status: 500 },
    );
  }
}
