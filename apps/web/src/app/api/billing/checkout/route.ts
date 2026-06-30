import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { CREDIT_PACKS } from "@seedance/models";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { packId } = await req.json();
  const pack = CREDIT_PACKS.find((p) => p.id === packId);
  if (!pack) {
    return NextResponse.json({ error: "Invalid pack" }, { status: 400 });
  }

  const dodoApiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!dodoApiKey) {
    return NextResponse.json(
      { error: "Payments not configured" },
      { status: 503 },
    );
  }

  const dodoBase =
    process.env.DODO_PAYMENTS_ENV === "live"
      ? "https://live.dodopayments.com"
      : "https://test.dodopayments.com";

  const res = await fetch(`${dodoBase}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${dodoApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_cart: [
        {
          product_id: pack.dodoProductId ?? `seedance-credits-${pack.id}`,
          quantity: 1,
        },
      ],
      customer: { email: userId },
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://seedanceapi.us"}/dashboard?payment=success`,
      metadata: {
        clerk_user_id: userId,
        pack_id: pack.id,
        credits: String(pack.credits),
      },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("Dodo checkout error:", text);
    return NextResponse.json({ error: "Checkout failed" }, { status: 502 });
  }

  const data = (await res.json()) as { checkout_url?: string };
  return NextResponse.json({ checkout_url: data.checkout_url });
}
