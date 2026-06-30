import { app } from "./routes";
import { handleMcp } from "./mcp/server";
import { PollGenerationWorkflow } from "./workflows/poll-generation";
import type { Env } from "./env";

export { PollGenerationWorkflow };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);
    if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
      return handleMcp(request, env);
    }
    return app.fetch(request, env, ctx);
  },
};
