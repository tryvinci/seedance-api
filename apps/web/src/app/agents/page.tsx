import type { Metadata } from "next";
import { getDocsUrl } from "@/lib/docs-url";

export const metadata: Metadata = {
  title: "For Agents & MCP",
  description:
    "Connect AI agents to Seedance API via MCP. Copy-paste configs for Cursor, Claude, and other agent frameworks.",
};

export default function AgentsPage() {
  const mcpConfig = `{
  "mcpServers": {
    "seedance": {
      "url": "https://api.seedanceapi.us/mcp",
      "headers": {
        "Authorization": "Bearer ak_YOUR_API_KEY"
      }
    }
  }
}`;

  return (
    <div className="paper-grain mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-4xl tracking-tight text-ink">
        For Agents &amp; MCP
      </h1>
      <p className="mt-4 text-ink-soft">
        Connect your AI agents to Seedance API via Model Context Protocol.
        Full guide in{" "}
        <a href={getDocsUrl("/agents")} className="text-accent hover:underline">
          the docs
        </a>
        .
      </p>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-ink">MCP server config</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Add this to your MCP settings (Cursor, Claude Desktop, etc.):
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-paper-edge bg-hero p-6 text-sm font-mono text-white">
          {mcpConfig}
        </pre>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-ink">Downloadable starters</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <a
            href="/agents/SKILL.md"
            download
            className="rounded-xl border border-paper-edge bg-white p-6 transition hover:border-accent/30 hover:shadow-md"
          >
            <h3 className="font-medium text-ink">SKILL.md</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Agent skill file for Cursor / Claude Code
            </p>
          </a>
          <a
            href="/agents/AGENTS.md"
            download
            className="rounded-xl border border-paper-edge bg-white p-6 transition hover:border-accent/30 hover:shadow-md"
          >
            <h3 className="font-medium text-ink">AGENTS.md</h3>
            <p className="mt-1 text-sm text-ink-soft">
              Agent instructions for autonomous workflows
            </p>
          </a>
        </div>
      </section>
    </div>
  );
}
