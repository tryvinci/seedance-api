import type { Metadata } from "next";
import { Suspense } from "react";
import { SignInPanel } from "@/components/clerk-auth-panel";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center text-sm text-ink-soft">
          Loading…
        </div>
      }
    >
      <SignInPanel />
    </Suspense>
  );
}
