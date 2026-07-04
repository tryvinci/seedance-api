import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { getDashboardUrl } from "@/lib/app-url";

export const metadata: Metadata = {
  title: "Sign up",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  const dashboardUrl = getDashboardUrl();

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-16">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl={dashboardUrl}
        signInFallbackRedirectUrl={dashboardUrl}
      />
    </div>
  );
}
