import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { getDashboardUrl } from "@/lib/app-url";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function SignInPage() {
  const dashboardUrl = getDashboardUrl();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl={dashboardUrl}
        signUpFallbackRedirectUrl={dashboardUrl}
      />
    </div>
  );
}
