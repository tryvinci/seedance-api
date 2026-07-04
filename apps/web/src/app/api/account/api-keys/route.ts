import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createUserApiKey } from "@/lib/ensure-default-api-key";

/** One-click create — name optional; defaults to "API key · {timestamp}". */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let name: string | undefined;
  try {
    const body = await req.json();
    if (typeof body?.name === "string") name = body.name;
  } catch {
    /* empty body is fine */
  }

  try {
    const key = await createUserApiKey(userId, name);
    return NextResponse.json({
      secret: key.secret,
      name: key.name,
      id: key.keyId,
    });
  } catch (err) {
    console.error("Create API key failed:", err);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 },
    );
  }
}
