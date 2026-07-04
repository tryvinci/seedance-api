"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SignIn, SignUp, useAuth } from "@clerk/nextjs";
import { getDashboardUrl } from "@/lib/app-url";

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
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-6 py-16">
      <div className="w-full max-w-md text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
          {title}
        </p>
      </div>
      {children}
    </div>
  );
}

function MissingClerkKey() {
  return (
    <AuthShell title="Sign in unavailable">
      <div className="max-w-md rounded-2xl border border-paper-edge bg-white p-6 text-left text-sm text-ink-soft">
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
    <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-6 text-left text-sm text-amber-950">
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
      <AuthShell title="Signed in">
        <p className="text-sm text-ink-soft">Taking you to your dashboard…</p>
        <a
          href="/dashboard"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper"
        >
          Open dashboard
        </a>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Sign in to SeedanceAPI">
      {!isLoaded && (
        <p className="text-sm text-ink-soft">Loading sign-in…</p>
      )}
      <div className="flex w-full max-w-md justify-center">
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl={dashboardUrl}
          signUpFallbackRedirectUrl={dashboardUrl}
        />
      </div>
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
      <AuthShell title="Signed in">
        <p className="text-sm text-ink-soft">Taking you to your dashboard…</p>
        <a
          href="/dashboard"
          className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper"
        >
          Open dashboard
        </a>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your SeedanceAPI account">
      {!isLoaded && (
        <p className="text-sm text-ink-soft">Loading sign-up…</p>
      )}
      <div className="flex w-full max-w-md justify-center">
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl={dashboardUrl}
          signInFallbackRedirectUrl={dashboardUrl}
        />
      </div>
      {stuck && !isLoaded && <ClerkStuck />}
    </AuthShell>
  );
}
