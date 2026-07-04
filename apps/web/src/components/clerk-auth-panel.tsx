"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClerkLoaded,
  ClerkLoading,
  SignIn,
  SignUp,
  useAuth,
} from "@clerk/nextjs";
import { getDashboardUrl } from "@/lib/app-url";

function usePostAuthRedirect() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const dashboardUrl = getDashboardUrl();

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

  return { isLoaded, isSignedIn, dashboardUrl };
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
      <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft">
        {title}
      </p>
      {children}
    </div>
  );
}

export function SignInPanel() {
  const { isLoaded, isSignedIn, dashboardUrl } = usePostAuthRedirect();

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
      <ClerkLoading>
        <p className="text-sm text-ink-soft">Loading sign-in…</p>
      </ClerkLoading>
      <ClerkLoaded>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          fallbackRedirectUrl={dashboardUrl}
          signUpFallbackRedirectUrl={dashboardUrl}
        />
      </ClerkLoaded>
    </AuthShell>
  );
}

export function SignUpPanel() {
  const { isLoaded, isSignedIn, dashboardUrl } = usePostAuthRedirect();

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
      <ClerkLoading>
        <p className="text-sm text-ink-soft">Loading sign-up…</p>
      </ClerkLoading>
      <ClerkLoaded>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          fallbackRedirectUrl={dashboardUrl}
          signInFallbackRedirectUrl={dashboardUrl}
        />
      </ClerkLoaded>
    </AuthShell>
  );
}
