import { listModels, listFamilies, modelToPublic } from "@seedance/models";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Models",
  description: "All SeedDance and Seedream models available via the Seedance API.",
};

export default function ModelsPage() {
  const families = listFamilies();

  return (
    <div className="paper-grain mx-auto max-w-6xl px-6 py-16">
      <h1 className="font-display text-4xl tracking-tight text-ink">Models</h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Every SeedDance video and Seedream image variant, with credit pricing
        and provider fallback. SeedDance 2.5 is listed but served via 2.0 until
        the native model ships.
      </p>

      {families.map((family) => {
        const models = listModels({ family });
        return (
          <section key={family} id={family} className="mt-16">
            <h2 className="font-display text-2xl capitalize text-ink">
              {family.replace(/-/g, " ")}
            </h2>
            <div className="mt-6 overflow-hidden rounded-2xl border border-paper-edge bg-white">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-paper-edge bg-paper-2/50">
                  <tr>
                    <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-soft">Model ID</th>
                    <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-soft">Variant</th>
                    <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-soft">Credits</th>
                    <th className="px-4 py-3 font-mono text-[11px] uppercase tracking-wider text-ink-soft">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((m) => {
                    const pub = modelToPublic(m);
                    return (
                      <tr key={m.id} className="border-b border-paper-edge/80">
                        <td className="px-4 py-3 font-mono text-xs text-accent">
                          {pub.id}
                        </td>
                        <td className="px-4 py-3 text-ink-2">{pub.variant}</td>
                        <td className="px-4 py-3 text-ink">{pub.credits}</td>
                        <td className="px-4 py-3 text-ink-soft">
                          {pub.alias_of ? `Alias → ${pub.alias_of}` : pub.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
