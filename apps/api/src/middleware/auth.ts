import { createClerkClient } from "@clerk/backend";
import { createMiddleware } from "hono/factory";
import type { Env, AuthContext } from "../env";

export type AppVariables = {
  auth: AuthContext;
};

function authorizedParties(env: Env): string[] {
  return (env.AUTHORIZED_PARTIES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Cloudflare secrets often store PEM newlines as literal \n. */
function normalizeJwtKey(key: string | undefined): string | undefined {
  if (!key?.trim()) return undefined;
  return key.replace(/\\n/g, "\n").trim();
}

function clerkClient(env: Env) {
  const secretKey = env.CLERK_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("CLERK_SECRET_KEY is not configured");
  }
  return createClerkClient({
    secretKey,
    jwtKey: normalizeJwtKey(env.CLERK_JWT_KEY),
  });
}

export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: AppVariables;
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const clerk = clerkClient(c.env);
    const state = await clerk.authenticateRequest(c.req.raw, {
      authorizedParties: authorizedParties(c.env),
      acceptsToken: ["api_key", "session_token"],
    });

    if (!state.isAuthenticated) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const authObj = state.toAuth();
    const ownerId = authObj.userId ?? authObj.orgId;
    if (!ownerId) {
      return c.json({ error: "No user or org identity" }, 401);
    }

    c.set("auth", {
      ownerId,
      tokenType: authObj.tokenType ?? "unknown",
    });
    await next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return c.json(
      {
        error: "Authentication failed",
        message:
          err instanceof Error ? err.message : "Could not verify credentials",
      },
      401,
    );
  }
});

export const optionalAuthMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Partial<AppVariables>;
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    await next();
    return;
  }
  try {
    const clerk = clerkClient(c.env);
    const state = await clerk.authenticateRequest(c.req.raw, {
      authorizedParties: authorizedParties(c.env),
      acceptsToken: ["api_key", "session_token"],
    });
    if (state.isAuthenticated) {
      const authObj = state.toAuth();
      const ownerId = authObj.userId ?? authObj.orgId;
      if (ownerId) {
        c.set("auth", { ownerId, tokenType: authObj.tokenType ?? "unknown" });
      }
    }
  } catch (err) {
    console.error("Optional auth error:", err);
  }
  await next();
});
