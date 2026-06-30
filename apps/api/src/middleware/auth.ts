import { createClerkClient } from "@clerk/backend";
import { createMiddleware } from "hono/factory";
import type { Env, AuthContext } from "../env";

export type AppVariables = {
  auth: AuthContext;
};

function authorizedParties(env: Env): string[] {
  return env.AUTHORIZED_PARTIES.split(",").map((s) => s.trim());
}

export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: AppVariables;
}>(async (c, next) => {
  const clerk = createClerkClient({
    secretKey: c.env.CLERK_SECRET_KEY,
    jwtKey: c.env.CLERK_JWT_KEY,
  });

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
});

export const optionalAuthMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: Partial<AppVariables>;
}>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) {
    await next();
    return;
  }
  const clerk = createClerkClient({
    secretKey: c.env.CLERK_SECRET_KEY,
    jwtKey: c.env.CLERK_JWT_KEY,
  });
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
  await next();
});
