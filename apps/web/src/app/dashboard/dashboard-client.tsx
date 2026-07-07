"use client";

import { APIKeys, useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AddBalanceModal } from "@/components/add-balance-modal";
import { AccountNav } from "@/components/account-nav";
import { BuyCreditsButton } from "@/components/buy-credits-button";
import { CopyButton } from "@/components/copy-button";
import { formatUsd, formatPrice, getModel, chargeUsd } from "@seedance/models";
import { getApiBaseUrl } from "@/lib/api-base";

type SnippetLang = "curl" | "javascript" | "python";

export function DashboardClient() {
  const { userId, getToken } = useAuth();
  const { user } = useUser();
  const [balanceUsd, setBalanceUsd] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [webhookOpen, setWebhookOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookStatus, setWebhookStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  const [defaultKey, setDefaultKey] = useState("");
  const [defaultKeyName, setDefaultKeyName] = useState<string | null>(null);
  const [keyVisible, setKeyVisible] = useState(false);
  const [keyLoading, setKeyLoading] = useState(true);
  const [creatingKey, setCreatingKey] = useState(false);
  const [keysRefresh, setKeysRefresh] = useState(0);
  const [snippetLang, setSnippetLang] = useState<SnippetLang>("curl");

  const apiBase = getApiBaseUrl();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    "";
  const storageKey = userId ? `seedance_default_api_key:${userId}` : null;
  const authHeader = defaultKey
    ? `Authorization: Bearer ${defaultKey}`
    : "Authorization: Bearer ak_…";
  const keyPlaceholder = defaultKey || "ak_your_key";

  const videoModel = getModel("seedance-2.5/text-to-video");
  const imageModel = getModel("seedream-5.0/text-to-image");
  const videoCall = videoModel
    ? chargeUsd(videoModel, { duration: 5 })
    : 0.8;
  const imageCall = imageModel?.priceUsd ?? 0.04;
  const bal = balanceUsd ?? 0;
  const videoGens = videoCall > 0 ? Math.floor(bal / videoCall) : 0;
  const imageGens = imageCall > 0 ? Math.floor(bal / imageCall) : 0;

  const snippets: Record<SnippetLang, string> = {
    curl: `curl ${apiBase}/v1/models \\
  -H "Authorization: Bearer ${keyPlaceholder}"`,
    javascript: `const res = await fetch("${apiBase}/v1/models", {
  headers: { Authorization: "Bearer ${keyPlaceholder}" },
});
const { data } = await res.json();`,
    python: `import requests

res = requests.get(
    "${apiBase}/v1/models",
    headers={"Authorization": f"Bearer ${keyPlaceholder}"},
)
print(res.json())`,
  };
  const activeSnippet = snippets[snippetLang];

  function saveDefaultKey(value: string) {
    setDefaultKey(value);
    if (!storageKey) return;
    try {
      if (value.trim()) sessionStorage.setItem(storageKey, value.trim());
      else sessionStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    async function load() {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // Dodo appends payment_id on return; reconcile if webhook never arrived.
      const params = new URLSearchParams(window.location.search);
      const paymentId = params.get("payment_id");
      const paymentStatus = params.get("status");
      let confirmedBalance: number | null = null;
      if (
        paymentId &&
        (!paymentStatus ||
          paymentStatus === "succeeded" ||
          paymentStatus === "success")
      ) {
        try {
          const confirmRes = await fetch("/api/billing/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
            cache: "no-store",
          });
          if (confirmRes.ok) {
            const confirmed = await confirmRes.json();
            if (typeof confirmed.balance_usd === "number") {
              confirmedBalance = confirmed.balance_usd;
              setBalanceUsd(confirmed.balance_usd);
            }
          }
        } catch {
          /* webhook may still land; balance loads below */
        }
        params.delete("payment_id");
        params.delete("status");
        params.delete("payment");
        params.delete("email");
        const clean = params.toString();
        window.history.replaceState(
          {},
          "",
          clean
            ? `${window.location.pathname}?${clean}`
            : window.location.pathname,
        );
      }

      try {
        const [balRes, bootRes] = await Promise.all([
          fetch("/api/account/balance", { cache: "no-store" }).catch(
            () => null,
          ),
          fetch("/api/account/bootstrap", { cache: "no-store" }).catch(
            () => null,
          ),
        ]);

        // Balance comes from the dedicated endpoint (same as navbar), not only
        // bootstrap — key provisioning failures must not zero the wallet UI.
        if (balRes?.ok) {
          const data = await balRes.json();
          const bal =
            typeof data.balance_usd === "number" ? data.balance_usd : 0;
          setBalanceUsd(
            confirmedBalance != null ? Math.max(confirmedBalance, bal) : bal,
          );
        } else if (confirmedBalance != null) {
          setBalanceUsd(confirmedBalance);
        }

        if (bootRes?.ok) {
          const data = await bootRes.json();
          // Prefer balance endpoint; fall back to bootstrap if it was unavailable.
          if (!balRes?.ok && typeof data.balance_usd === "number") {
            setBalanceUsd(
              confirmedBalance != null
                ? Math.max(confirmedBalance, data.balance_usd)
                : data.balance_usd,
            );
          }
          setDefaultKeyName(
            typeof data.default_api_key_name === "string"
              ? data.default_api_key_name
              : null,
          );
          const secret =
            typeof data.default_api_key === "string"
              ? data.default_api_key
              : "";
          if (secret) {
            saveDefaultKey(secret);
          } else if (storageKey) {
            try {
              const saved = sessionStorage.getItem(storageKey);
              if (saved) setDefaultKey(saved);
            } catch {
              /* ignore */
            }
          }
        }
      } finally {
        setLoading(false);
        setKeyLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once per user session
  }, [userId, getToken, apiBase, storageKey]);

  async function saveWebhook() {
    setWebhookStatus("saving");
    try {
      const res = await fetch("/api/webhooks/configure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
      setWebhookStatus(res.ok ? "saved" : "error");
      if (res.ok) {
        window.setTimeout(() => setWebhookStatus("idle"), 2000);
      }
    } catch {
      setWebhookStatus("error");
    }
  }

  async function createApiKey() {
    setCreatingKey(true);
    try {
      const res = await fetch("/api/account/api-keys", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Failed to create API key");
        return;
      }
      if (typeof data.secret === "string") {
        saveDefaultKey(data.secret);
        setKeyVisible(true);
      }
      if (typeof data.name === "string") setDefaultKeyName(data.name);
      setKeysRefresh((n) => n + 1);
    } catch {
      alert("Failed to create API key");
    } finally {
      setCreatingKey(false);
    }
  }

  return (
    <div className="paper-grain min-h-[70vh]">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
              Account
            </p>
            <h1 className="mt-1 font-display text-3xl tracking-tight text-ink">
              Dashboard
            </h1>
            {email && <p className="mt-1 text-sm text-ink-soft">{email}</p>}
          </div>
          <AccountNav />
        </header>

        {/* Top: Quickstart | Balance — equal height */}
        <div className="mt-10 grid items-stretch gap-6 lg:grid-cols-2">
          <section className="flex flex-col rounded-2xl border border-paper-edge bg-white p-6">
            <h2 className="font-display text-xl text-ink">Quickstart</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {keyLoading
                ? "Provisioning your default API key…"
                : defaultKey
                  ? "Copy your key and start calling the API."
                  : "Create a key in one click — no name required."}
            </p>

            <div className="mt-5 flex flex-1 flex-col gap-3">
              <div>
                <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                  API base
                </p>
                <div className="flex items-center gap-2 rounded-xl border border-paper-edge bg-paper/40 px-3 py-2.5">
                  <code className="min-w-0 flex-1 truncate font-mono text-sm text-ink">
                    {apiBase}
                  </code>
                  <CopyButton value={apiBase} label="Copy" />
                </div>
              </div>

              <div>
                <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                  API key
                  {defaultKeyName ? ` · ${defaultKeyName}` : ""}
                </p>
                <div className="flex items-center gap-2 rounded-xl border border-paper-edge bg-paper/40 px-3 py-2.5">
                  <input
                    type={keyVisible ? "text" : "password"}
                    value={defaultKey}
                    onChange={(e) => saveDefaultKey(e.target.value)}
                    placeholder={keyLoading ? "Loading…" : "ak_…"}
                    autoComplete="off"
                    spellCheck={false}
                    disabled={keyLoading}
                    className="min-w-0 flex-1 bg-transparent font-mono text-sm text-ink outline-none placeholder:text-ink-soft/50 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setKeyVisible((v) => !v)}
                    className="shrink-0 rounded-lg px-2 py-1 text-xs font-medium text-ink-soft transition hover:bg-white hover:text-ink"
                  >
                    {keyVisible ? "Hide" : "Show"}
                  </button>
                  <CopyButton
                    value={defaultKey}
                    label="Copy"
                    className={!defaultKey ? "pointer-events-none opacity-40" : ""}
                  />
                </div>
              </div>

              <div>
                <p className="mb-1.5 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
                  Auth header
                </p>
                <div className="flex items-center gap-2 rounded-xl border border-paper-edge bg-paper/40 px-3 py-2.5">
                  <code className="min-w-0 flex-1 truncate font-mono text-xs text-ink-2">
                    {authHeader}
                  </code>
                  <CopyButton
                    value={defaultKey ? authHeader : ""}
                    label="Copy"
                    className={!defaultKey ? "pointer-events-none opacity-40" : ""}
                  />
                </div>
              </div>

              <div className="mt-auto flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={createApiKey}
                  disabled={creatingKey || keyLoading}
                  className="inline-flex w-full items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-ink-2 disabled:opacity-50"
                >
                  {creatingKey ? "Creating…" : "Create API key"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("api-keys")
                      ?.scrollIntoView({ behavior: "smooth", block: "start" })
                  }
                  className="inline-flex w-full items-center justify-center rounded-full border border-paper-edge bg-white px-4 py-2.5 text-sm font-medium text-ink-2 transition hover:border-ink-soft hover:bg-paper-2 hover:text-ink"
                >
                  Manage keys
                </button>
              </div>
            </div>
          </section>

          <section className="flex flex-col rounded-2xl border border-paper-edge bg-white p-6">
            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-soft">
                Balance
              </p>
              <p className="mt-3 font-display text-5xl tracking-tight text-ink sm:text-6xl">
                {loading ? "—" : formatUsd(bal)}
              </p>
              <p className="mt-2 text-sm text-ink-soft">Prepaid USD</p>
              {!loading && (
                <p className="mt-4 max-w-[16rem] text-sm leading-relaxed text-ink-soft">
                  {bal <= 0 ? (
                    <>Add balance to run generations.</>
                  ) : (
                    <>
                      About{" "}
                      <span className="font-medium text-ink">
                        {videoGens.toLocaleString()}
                      </span>{" "}
                      × 5s videos (
                      {videoModel
                        ? formatPrice(videoModel.priceUsd, "second")
                        : "$0.16/sec"}
                      ), or{" "}
                      <span className="font-medium text-ink">
                        {imageGens.toLocaleString()}
                      </span>{" "}
                      images (
                      {imageModel
                        ? formatPrice(imageModel.priceUsd, "generation")
                        : "$0.04/gen"}
                      ).
                    </>
                  )}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <BuyCreditsButton
                packId="builder"
                label="Add $20"
                variant="primary"
              />
              <button
                type="button"
                onClick={() => setBalanceOpen(true)}
                className="inline-flex w-full items-center justify-center rounded-full border border-paper-edge bg-white px-4 py-2.5 text-sm font-medium text-ink-2 transition hover:border-ink-soft hover:bg-paper-2 hover:text-ink"
              >
                More amounts
              </button>
            </div>
          </section>
        </div>

        {/* Example request — full width, multi-language */}
        <section className="mt-6 rounded-2xl border border-paper-edge bg-hero p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-full bg-white/10 p-1">
              {(
                [
                  ["curl", "cURL"],
                  ["javascript", "JavaScript"],
                  ["python", "Python"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSnippetLang(id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    snippetLang === id
                      ? "bg-white text-hero"
                      : "text-white/60 hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <CopyButton
              value={activeSnippet}
              label="Copy"
              className="border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/15 hover:text-white"
            />
          </div>
          <pre className="mt-4 overflow-x-auto font-mono text-[12px] leading-relaxed text-white/90">
            {activeSnippet}
          </pre>
        </section>

        {/* API keys manager */}
        <section
          id="api-keys"
          className="mt-6 scroll-mt-24 rounded-2xl border border-paper-edge bg-white p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl text-ink">API keys</h2>
              <p className="mt-1 text-sm text-ink-soft">
                One-click create uses an auto name like{" "}
                <span className="font-mono text-xs">API key · Jul 3, 2026…</span>
                . Revoke unused keys here.
              </p>
            </div>
            <button
              type="button"
              onClick={createApiKey}
              disabled={creatingKey}
              className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper transition hover:bg-ink-2 disabled:opacity-50"
            >
              {creatingKey ? "Creating…" : "Create API key"}
            </button>
          </div>
          <div
            key={keysRefresh}
            className="cl-apiKeys mt-5 overflow-hidden rounded-xl border border-paper-edge bg-white p-3"
          >
            <APIKeys
              showDescription={false}
              appearance={{
                baseTheme: undefined,
                variables: {
                  colorBackground: "#ffffff",
                  colorInputBackground: "#ffffff",
                  colorInputText: "#181b20",
                  colorText: "#181b20",
                  colorTextSecondary: "#5c6370",
                  colorTextOnPrimaryBackground: "#ffffff",
                  colorPrimary: "#2563eb",
                  colorNeutral: "#181b20",
                  colorDanger: "#dc2626",
                  borderRadius: "0.75rem",
                },
                elements: {
                  rootBox: "w-full",
                  cardBox: "shadow-none border-0 bg-white",
                  card: "bg-white shadow-none",
                  formFieldInput:
                    "bg-white text-[#181b20] border border-[#e7e5e4]",
                  formFieldLabel: "text-[#5c6370]",
                  selectButton:
                    "bg-white text-[#181b20] border border-[#e7e5e4]",
                  selectOptionsContainer: "bg-white text-[#181b20]",
                  selectOption: "text-[#181b20] bg-white",
                  menuList: "bg-white text-[#181b20]",
                  menuItem: "text-[#181b20]",
                  menuButton: "text-[#181b20]",
                  button: "text-[#181b20]",
                  table: "text-[#181b20]",
                  tableHead: "text-[#5c6370]",
                },
              }}
            />
          </div>
        </section>

        {/* Generations */}
        <section className="mt-6 rounded-2xl border border-paper-edge bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl text-ink">Generations</h2>
              <p className="mt-1 text-sm text-ink-soft">
                Browse the last 7 days of jobs, open outputs, and page through
                history.
              </p>
            </div>
            <Link
              href="/generations"
              className="inline-flex items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink-2"
            >
              View generations
            </Link>
          </div>
        </section>

        {/* Optional webhook */}
        <section className="mt-6 rounded-2xl border border-paper-edge bg-white">
          <button
            type="button"
            onClick={() => setWebhookOpen((v) => !v)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <div>
              <h2 className="font-display text-lg text-ink">
                Webhook{" "}
                <span className="font-sans text-sm font-normal text-ink-soft">
                  (optional)
                </span>
              </h2>
              <p className="mt-0.5 text-sm text-ink-soft">
                Notified when a generation completes or fails — useful for async
                video jobs instead of polling.
              </p>
            </div>
            <span className="ml-4 text-ink-soft">{webhookOpen ? "−" : "+"}</span>
          </button>
          {webhookOpen && (
            <div className="border-t border-paper-edge px-6 py-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => {
                    setWebhookUrl(e.target.value);
                    setWebhookStatus("idle");
                  }}
                  placeholder="https://your-app.com/webhooks/seedance"
                  className="min-w-0 flex-1 rounded-xl border border-paper-edge bg-paper/40 px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-accent focus:bg-white"
                />
                <button
                  type="button"
                  onClick={saveWebhook}
                  disabled={webhookStatus === "saving" || !webhookUrl.trim()}
                  className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-ink-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {webhookStatus === "saving"
                    ? "Saving…"
                    : webhookStatus === "saved"
                      ? "Saved"
                      : webhookStatus === "error"
                        ? "Retry"
                        : "Save"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      <AddBalanceModal
        open={balanceOpen}
        onClose={() => {
          setBalanceOpen(false);
          fetch("/api/account/balance", { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
              if (data && typeof data.balance_usd === "number") {
                setBalanceUsd(data.balance_usd);
              }
            })
            .catch(() => {});
        }}
      />
    </div>
  );
}
