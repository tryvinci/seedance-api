"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SignIn, SignUp, useAuth } from "@clerk/nextjs";
import { getDashboardUrl } from "@/lib/app-url";
import { clerkAppearance } from "@/lib/clerk-appearance";
import { Logo } from "@/components/logo";

function usePostAuthRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const redirect = searchParams.get("redirect_url");
    if (redirect) {
      try {
        const url = new URL(redirect, window.location.origin);
        if (url.origin === window.location.origin) {
          router.replace(url.pathname + url.search);
          return;
        }
      } catch {
        /* fall through */
      }
    }
    router.replace("/dashboard");
  }, [isLoaded, isSignedIn, router, searchParams]);

  return { isLoaded, isSignedIn };
}

function AuthShell({
  children,
  eyebrow,
}: {
  children: React.ReactNode;
  eyebrow: string;
}) {
  return (
    <div className="paper-grain relative min-h-[calc(100vh-4rem)]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_at_50%_0%,hsl(213_94%_68%/0.18),transparent_65%)]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center gap-8 px-6 py-16">
        <div className="flex flex-col items-center gap-4 text-center">
          <Logo href="/" />
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
            {eyebrow}
          </p>
        </div>
        <div className="w-full">{children}</div>
        <p className="text-center text-xs text-ink-soft">
          <Link href="/" className="hover:text-ink">
            ← Back to SeedanceAPI
          </Link>
        </p>
      </div>
    </div>
  );
}

function MissingClerkKey() {
  return (
    <AuthShell eyebrow="Sign in unavailable">
      <div className="rounded-2xl border border-paper-edge bg-white p-6 text-left text-sm text-ink-soft">
        <p className="font-medium text-ink">Clerk publishable key is missing.</p>
        <p className="mt-2">
          In Cloudflare → <code className="font-mono text-xs">seedance-web</code>{" "}
          set{" "}
          <code className="font-mono text-xs">
            NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
          </code>{" "}
          as both a <strong>Build</strong> variable and a <strong>Runtime</strong>{" "}
          variable, then redeploy.
        </p>
      </div>
    </AuthShell>
  );
}

function ClerkStuck() {
  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-left text-sm text-amber-950">
      <p className="font-medium">Clerk did not load on this domain.</p>
      <p className="mt-2">
        In the Clerk dashboard for this app, add{" "}
        <code className="font-mono text-xs">seedanceapi.us</code> under{" "}
        <strong>Domains</strong>, and allow redirects to{" "}
        <code className="font-mono text-xs">https://seedanceapi.us/*</code>.
      </p>
    </div>
  );
}

export function SignInPanel() {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return <MissingClerkKey />;
  return <SignInPanelInner />;
}

function SignInPanelInner() {
  const { isLoaded, isSignedIn } = usePostAuthRedirect();
  const dashboardUrl = getDashboardUrl();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setStuck(true), 8000);
    return () => window.clearTimeout(t);
  }, []);

  if (isLoaded && isSignedIn) {
    return (
      <AuthShell eyebrow="Signed in">
        <div className="rounded-2xl border border-paper-edge bg-white p-8 text-center">
          <p className="font-display text-2xl tracking-tight text-ink">
            Welcome back
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Taking you to your dashboard…
          </p>
          <a
            href="/dashboard"
            className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink-2"
          >
            Open dashboard
          </a>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Sign in to continue">
      {!isLoaded && (
        <p className="mb-4 text-center text-sm text-ink-soft">
          Loading sign-in…
        </p>
      )}
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl={dashboardUrl}
        signUpFallbackRedirectUrl={dashboardUrl}
        appearance={clerkAppearance}
      />
      {stuck && !isLoaded && <ClerkStuck />}
    </AuthShell>
  );
}

export function SignUpPanel() {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return <MissingClerkKey />;
  return <SignUpPanelInner />;
}

function SignUpPanelInner() {
  const { isLoaded, isSignedIn } = usePostAuthRedirect();
  const dashboardUrl = getDashboardUrl();
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setStuck(true), 8000);
    return () => window.clearTimeout(t);
  }, []);

  if (isLoaded && isSignedIn) {
    return (
      <AuthShell eyebrow="Signed in">
        <div className="rounded-2xl border border-paper-edge bg-white p-8 text-center">
          <p className="font-display text-2xl tracking-tight text-ink">
            You&apos;re in
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            Taking you to your dashboard…
          </p>
          <a
            href="/dashboard"
            className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink-2"
          >
            Open dashboard
          </a>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell eyebrow="Create your account">
      {!isLoaded && (
        <p className="mb-4 text-center text-sm text-ink-soft">
          Loading sign-up…
        </p>
      )}
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl={dashboardUrl}
        signInFallbackRedirectUrl={dashboardUrl}
        appearance={clerkAppearance}
      />
      {stuck && !isLoaded && <ClerkStuck />}
    </AuthShell>
  );
}
