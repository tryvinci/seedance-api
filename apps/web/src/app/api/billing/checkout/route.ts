import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { drizzle } from "drizzle-orm/d1";
import { addCredits, getWalletBalance } from "@seedance/db";
import { CREDIT_PACKS, creditsToUsd, usdToCredits } from "@seedance/models";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getDodoApiBase } from "@/lib/dodo";

const MIN_USD = 5;
const MAX_USD = 10_000;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const packId = body.packId as string | undefined;
  const amountUsdRaw = body.amountUsd as number | string | undefined;

  let credits: number;
  let amountUsd: number;
  let metaPackId: string;

  if (packId) {
    const pack = CREDIT_PACKS.find((p) => p.id === packId);
    if (!pack) {
      return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
    }
    credits = pack.credits;
    amountUsd = pack.priceUsd;
    metaPackId = pack.id;
  } else if (amountUsdRaw != null && amountUsdRaw !== "") {
    amountUsd = Math.round(Number(amountUsdRaw) * 100) / 100;
    if (!Number.isFinite(amountUsd) || amountUsd < MIN_USD || amountUsd > MAX_USD) {
      return NextResponse.json(
        { error: `Amount must be between $${MIN_USD} and $${MAX_USD}` },
        { status: 400 },
      );
    }
    credits = usdToCredits(amountUsd);
    metaPackId = "custom";
  } else {
    return NextResponse.json(
      { error: "packId or amountUsd required" },
      { status: 400 },
    );
  }

  const productId = process.env.DODO_TOPUP_PRODUCT_ID?.trim();
  const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY?.trim();
  const isDev = process.env.NODE_ENV === "development";

  // Local/dev: credit wallet immediately when Dodo isn't fully configured.
  const useDevCredit =
    isDev &&
    (process.env.DODO_DEV_CREDIT === "true" || !dodoApiKey || !productId);

  if (useDevCredit) {
    try {
      const { env } = await getCloudflareContext({ async: true });
      const db = drizzle(env.DB);
      const paymentId = `dev_${crypto.randomUUID()}`;
      await addCredits(db, userId, credits, "purchase", paymentId);
      const balance = await getWalletBalance(db, userId);
      return NextResponse.json({
        credited: true,
        balance_usd: creditsToUsd(balance),
        amount_usd: amountUsd,
        message: "Dev top-up applied (Dodo checkout skipped).",
      });
    } catch (err) {
      console.error("Dev credit failed:", err);
      return NextResponse.json(
        { error: "Could not credit wallet. Run pnpm db:migrate:local." },
        { status: 500 },
      );
    }
  }

  if (!dodoApiKey) {
    return NextResponse.json(
      { error: "Payments not configured" },
      { status: 503 },
    );
  }

  if (!productId) {
    return NextResponse.json(
      {
        error:
          "Top-up product not configured. Set DODO_TOPUP_PRODUCT_ID to a pay-what-you-want Dodo product id.",
      },
      { status: 503 },
    );
  }

  let customerEmail = `${userId}@users.clerk.accounts`;
  let customerName: string | undefined;
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    customerEmail =
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses[0]?.emailAddress ??
      customerEmail;
    customerName =
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      user.username ||
      undefined;
  } catch {
    /* fall back to synthetic email */
  }

  // Prefer the browser origin so post-pay redirect matches where checkout started
  // (localhost in dev, seedanceapi.us in prod) — not a shared Dodo merchant default.
  const originHeader = req.headers.get("origin");
  const referer = req.headers.get("referer");
  let appUrl: string | undefined;
  if (originHeader?.startsWith("http")) {
    appUrl = originHeader.replace(/\/$/, "");
  } else if (referer) {
    try {
      appUrl = new URL(referer).origin;
    } catch {
      /* ignore */
    }
  }
  appUrl =
    appUrl ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://seedanceapi.us";
  const returnUrl = `${appUrl}/dashboard?payment=success`;
  const dodoBase = getDodoApiBase();

  // Single PWYW product: amount is in the lowest currency unit (cents for USD).
  const res = await fetch(`${dodoBase}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${dodoApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
          amount: Math.round(amountUsd * 100),
        },
      ],
      customer: {
        email: customerEmail,
        ...(customerName ? { name: customerName } : {}),
      },
      return_url: returnUrl,
      cancel_url: `${appUrl}/dashboard`,
      // Skip Dodo's default success page (often links to the merchant site,
      // e.g. Vinci on a shared account) and send users straight back here.
      feature_flags: {
        redirect_immediately: true,
      },
      metadata: {
        clerk_user_id: userId,
        pack_id: metaPackId,
        credits: String(credits),
        amount_usd: String(amountUsd),
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Dodo checkout error:", res.status, text);
    let detail = "Checkout failed";
    try {
      const parsed = JSON.parse(text) as {
        error?: string;
        message?: string;
        code?: string;
      };
      const msg = `${parsed.error ?? ""} ${parsed.message ?? ""} ${parsed.code ?? ""}`.toLowerCase();
      if (msg.includes("unauthorized") || res.status === 401) {
        detail =
          "Payment provider rejected the API key. Check DODO_PAYMENTS_API_KEY matches DODO_PAYMENTS_ENV (test vs live).";
      } else if (
        msg.includes("product") ||
        msg.includes("not found") ||
        res.status === 404 ||
        res.status === 422
      ) {
        detail =
          "Payment product is not configured. Set DODO_TOPUP_PRODUCT_ID to a pay-what-you-want product id.";
      } else if (parsed.message) {
        detail = "Checkout failed. Please try again or contact support.";
      }
    } catch {
      /* keep default */
    }
    return NextResponse.json({ error: detail }, { status: 502 });
  }

  const data = (await res.json()) as {
    checkout_url?: string | null;
    session_id?: string;
  };
  if (!data.checkout_url) {
    console.error("Dodo checkout missing checkout_url:", data);
    return NextResponse.json(
      { error: "Checkout session created without a URL" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    checkout_url: data.checkout_url,
    session_id: data.session_id,
  });
}
