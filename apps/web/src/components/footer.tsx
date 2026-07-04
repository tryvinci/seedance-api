import Link from "next/link";
import { getDocsUrl } from "@/lib/docs-url";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="mt-24 bg-hero text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-5">
        <div className="sm:col-span-2">
          <Logo dark href="/" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-paper/60">
            The API for SeedDance video and Seedream image models. Simple
            pricing, MCP support, and docs built for agents.
          </p>
        </div>
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper/40">
            Product
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/65">
            <li>
              <Link href="/models" className="hover:text-paper">
                Models
              </Link>
            </li>
            <li>
              <Link href="/pricing" className="hover:text-paper">
                Pricing
              </Link>
            </li>
            <li>
              <a href={getDocsUrl()} className="hover:text-paper">
                Documentation
              </a>
            </li>
            <li>
              <Link href="/agents" className="hover:text-paper">
                For Agents
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper/40">
            Developers
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/65">
            <li>
              <a
                href="https://api.seedanceapi.us/openapi.json"
                className="hover:text-paper"
              >
                OpenAPI
              </a>
            </li>
            <li>
              <Link href="/llms.txt" className="hover:text-paper">
                llms.txt
              </Link>
            </li>
            <li>
              <Link href="/llms-full.txt" className="hover:text-paper">
                llms-full.txt
              </Link>
            </li>
            <li>
              <a
                href="https://api.seedanceapi.us/health"
                className="hover:text-paper"
              >
                API Status
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper/40">
            Legal
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/65">
            <li>
              <Link href="/privacy" className="hover:text-paper">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="hover:text-paper">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/refunds" className="hover:text-paper">
                Refund Policy
              </Link>
            </li>
            <li>
              <a
                href="mailto:support@seedanceapi.us"
                className="hover:text-paper"
              >
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 text-xs text-paper/40 sm:flex-row">
          <p>
            &copy; {new Date().getFullYear()} SeedanceAPI. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <Link href="/privacy" className="hover:text-paper/70">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-paper/70">
              Terms
            </Link>
            <Link href="/refunds" className="hover:text-paper/70">
              Refunds
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
