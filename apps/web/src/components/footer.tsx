import Link from "next/link";
import { getDocsUrl } from "@/lib/docs-url";

export function Footer() {
  return (
    <footer className="mt-24 bg-hero text-paper">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <p className="font-display text-xl">Seedance API</p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-paper/60">
            Production API for SeedDance video and Seedream image models.
            Built on Cloudflare with Clerk auth and prepaid credits.
          </p>
        </div>
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper/40">
            Product
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/65">
            <li><Link href="/models" className="hover:text-paper">Models</Link></li>
            <li><Link href="/pricing" className="hover:text-paper">Pricing</Link></li>
            <li><a href={getDocsUrl()} className="hover:text-paper">Documentation</a></li>
            <li><Link href="/agents" className="hover:text-paper">For Agents</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-paper/40">
            Developers
          </p>
          <ul className="mt-4 space-y-2.5 text-sm text-paper/65">
            <li><a href="https://api.seedanceapi.us/openapi.json" className="hover:text-paper">OpenAPI</a></li>
            <li><Link href="/llms.txt" className="hover:text-paper">llms.txt</Link></li>
            <li><Link href="/llms-full.txt" className="hover:text-paper">llms-full.txt</Link></li>
            <li><a href="https://api.seedanceapi.us/health" className="hover:text-paper">API Status</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-6 text-center text-xs text-paper/40">
        &copy; {new Date().getFullYear()} Seedance API. All rights reserved.
      </div>
    </footer>
  );
}
