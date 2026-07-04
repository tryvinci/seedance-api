import type { Metadata } from "next";
import { AgentsClient } from "./agents-client";

export const metadata: Metadata = {
  title: "For Agents & MCP",
  description:
    "Connect AI agents to SeedanceAPI via MCP or a copy-paste quickstart prompt. llms.txt and OpenAPI included.",
  alternates: { canonical: "/agents" },
  openGraph: {
    title: "For Agents & MCP | SeedanceAPI",
    description:
      "MCP tools, agent prompts, and machine-readable docs for SeedanceAPI.",
    url: "/agents",
  },
};

export default function AgentsPage() {
  return <AgentsClient />;
}
