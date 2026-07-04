"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CopyButton } from "@/components/copy-button";
import { getDocsUrl } from "@/lib/docs-url";

const MCP_TEMPLATE = `{
  "mcpServers": {
    "seedance": {
      "url": "https://api.seedanceapi.us/mcp",
      "headers": {
        "Authorization": "Bearer {{API_KEY}}"
      }
    }
  }
}`;

function buildAgentPrompt(apiKey: string | null, includeKey: boolean): string {
  const keyLine = includeKey && apiKey
    ? `API key: ${apiKey}`
    : "API key: use the user's SeedanceAPI key from their dashboard (format ak_...)";

  return `You are helping me use SeedanceAPI to generate AI video and images.

Base URL: https://api.seedanceapi.us
${keyLine}
Auth header: Authorization: Bearer <api_key>

Capabilities:
- Video: SeedDance 2.5 / 2.0 (billed per second)
- Image: Seedream 5.0 / 4.x (billed per generation)

Workflow:
1. GET /v1/credits — check balance (returns balance_usd)
2. Optional: POST /v1/media/upload (multipart file) → { url } for image_url / video_url inputs
3. POST /v1/videos with JSON { model, prompt, duration?, aspect_ratio?, image_url? } → { id }
4. Poll GET /v1/generations/{id} until status is completed or failed
5. Use output_url when completed
6. For images: POST /v1/images returns output_urls immediately

Example models:
- seedance-2.5/text-to-video
- seedance-2.0-fast/text-to-video
- seedream-5.0/text-to-image

On 402, tell me to add balance at https://seedanceapi.us/pricing.

Start by listing models, then help me generate what I ask for.`;
}

export function AgentsClient() {
  const { isSignedIn } = useAuth();
  const [includeKey, setIncludeKey] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [skillMd, setSkillMd] = useState("");
  const [agentsMd, setAgentsMd] = useState("");

  useEffect(() => {
    if (!isSignedIn) {
      setApiKey(null);
      return;
    }
    try {
      // Prefer session-stored default key from dashboard
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k?.startsWith("seedance_default_api_key:")) {
          const v = sessionStorage.getItem(k);
          if (v) {
            setApiKey(v);
            return;
          }
        }
      }
    } catch {
      /* ignore */
    }
    fetch("/api/account/bootstrap")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.default_api_key) setApiKey(data.default_api_key);
      })
      .catch(() => {});
  }, [isSignedIn]);

  useEffect(() => {
    Promise.all([
      fetch("/agents/SKILL.md").then((r) => r.text()),
      fetch("/agents/AGENTS.md").then((r) => r.text()),
    ]).then(([skill, agents]) => {
      setSkillMd(skill);
      setAgentsMd(agents);
    });
  }, []);

  const keyForConfig = includeKey && apiKey ? apiKey : "ak_YOUR_API_KEY";
  const mcpConfig = useMemo(
    () => MCP_TEMPLATE.replaceAll("{{API_KEY}}", keyForConfig),
    [keyForConfig],
  );
  const agentPrompt = useMemo(
    () => buildAgentPrompt(apiKey, includeKey),
    [apiKey, includeKey],
  );

  return (
    <div className="paper-grain mx-auto max-w-4xl px-6 py-16">
      <h1 className="font-display text-4xl tracking-tight text-ink">
        For Agents &amp; MCP
      </h1>
      <p className="mt-4 text-ink-soft">
        Connect AI agents to SeedanceAPI via MCP or a copy-paste prompt. Full
        guide in{" "}
        <a href={getDocsUrl("/agents")} className="text-accent hover:underline">
          the docs
        </a>
        .
      </p>

      <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl border border-paper-edge bg-white px-4 py-3">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={includeKey}
            onChange={(e) => setIncludeKey(e.target.checked)}
            className="h-4 w-4 rounded border-paper-edge text-accent focus:ring-accent"
          />
          Include my default API key in copyable snippets
        </label>
        {includeKey && !apiKey && (
          <p className="text-xs text-ink-soft">
            No key in this session.{" "}
            <Link href="/dashboard" className="text-accent hover:underline">
              Open dashboard
            </Link>{" "}
            to load your default key.
          </p>
        )}
        {includeKey && apiKey && (
          <p className="text-xs text-ink-soft">
            Key will be embedded — only paste into tools you trust.
          </p>
        )}
      </div>

      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-ink">
              Quickstart prompt
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Paste into Cursor, Claude, ChatGPT, or any agent to get started.
            </p>
          </div>
          <CopyButton value={agentPrompt} label="Copy prompt" />
        </div>
        <pre className="mt-4 max-h-80 overflow-auto rounded-xl border border-paper-edge bg-hero p-6 text-sm font-mono leading-relaxed text-white/90 whitespace-pre-wrap">
          {agentPrompt}
        </pre>
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl text-ink">MCP server config</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Add this to Cursor, Claude Desktop, or other MCP clients.
            </p>
          </div>
          <CopyButton value={mcpConfig} label="Copy config" />
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-paper-edge bg-hero p-6 text-sm font-mono text-white">
          {mcpConfig}
        </pre>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-ink">Starter files</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Drop these into your agent project, or copy the contents.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <FileCard
            title="SKILL.md"
            description="Agent skill for Cursor / Claude Code"
            href="/agents/SKILL.md"
            content={skillMd}
          />
          <FileCard
            title="AGENTS.md"
            description="Instructions for autonomous workflows"
            href="/agents/AGENTS.md"
            content={agentsMd}
          />
        </div>
      </section>
    </div>
  );
}

function FileCard({
  title,
  description,
  href,
  content,
}: {
  title: string;
  description: string;
  href: string;
  content: string;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-paper-edge bg-white p-6">
      <h3 className="font-medium text-ink">{title}</h3>
      <p className="mt-1 flex-1 text-sm text-ink-soft">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <CopyButton
          value={content}
          label="Copy contents"
          className={!content ? "pointer-events-none opacity-40" : ""}
        />
        <a
          href={href}
          download
          className="inline-flex items-center justify-center rounded-lg border border-paper-edge bg-white px-3 py-1.5 text-xs font-medium text-ink-2 transition hover:border-ink-soft hover:bg-paper-2 hover:text-ink"
        >
          Download
        </a>
      </div>
    </div>
  );
}
