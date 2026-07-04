import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing use of the SeedanceAPI service.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

const UPDATED = "July 4, 2026";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated={UPDATED}>
      <p>
        These Terms of Service (&quot;Terms&quot;) govern access to and use of
        SeedanceAPI websites, APIs, and related services (the
        &quot;Service&quot;). By creating an account or using the Service, you
        agree to these Terms.
      </p>

      <LegalSection title="The Service">
        <p>
          SeedanceAPI provides API access to video and image generation models
          on a prepaid, pay-as-you-go basis. Features, models, and pricing may
          change. We may modify, suspend, or discontinue any part of the Service
          with or without notice.
        </p>
      </LegalSection>

      <LegalSection title="Accounts and API keys">
        <p>
          You must provide accurate account information and keep credentials
          secure. You are responsible for all activity under your account and
          API keys. Notify us promptly of unauthorized use. We may suspend or
          terminate accounts that violate these Terms or pose risk to the
          Service or other users.
        </p>
      </LegalSection>

      <LegalSection title="Billing">
        <p>
          The Service uses a prepaid USD balance. Generations are charged at the
          then-current model rates (for example, per second of video or per
          image generation). Rates are shown on our{" "}
          <Link href="/pricing" className="text-accent hover:underline">
            pricing page
          </Link>{" "}
          and in the API. Balance is non-transferable. Refunds are governed by
          our{" "}
          <Link href="/refunds" className="text-accent hover:underline">
            Refund Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Violate applicable law or third-party rights</li>
          <li>
            Use the Service to create or distribute illegal, harmful, or
            abusive content
          </li>
          <li>
            Attempt to probe, disrupt, or gain unauthorized access to the
            Service or related systems
          </li>
          <li>
            Resell or sublicense the Service in a way that circumvents our
            access controls or pricing, except as expressly permitted
          </li>
          <li>
            Misrepresent outputs as human-created where disclosure is required
            by law or platform policy
          </li>
        </ul>
        <p>
          We may investigate and take action, including suspension, for
          suspected violations.
        </p>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          You retain rights to prompts and other inputs you provide, and to
          outputs generated for you, subject to these Terms and applicable law.
          You grant us a limited license to process inputs and outputs solely to
          provide and secure the Service, including routing requests to
          underlying model providers. You represent that you have the rights
          needed to submit your inputs.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual property">
        <p>
          The Service, including our branding, documentation, and software, is
          owned by us or our licensors. These Terms do not grant you rights to
          our trademarks or to reverse engineer the Service except where
          prohibited restrictions are not allowed by law.
        </p>
      </LegalSection>

      <LegalSection title="Third-party services">
        <p>
          The Service depends on third parties (authentication, payments,
          hosting, and model providers). Their availability and policies may
          affect the Service. We are not responsible for third-party services we
          do not control.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimer">
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS
          AVAILABLE.&quot; TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM
          ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS
          FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. Model outputs may be
          inaccurate, offensive, or unsuitable; you are responsible for
          reviewing and using outputs appropriately.
        </p>
      </LegalSection>

      <LegalSection title="Limitation of liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE WILL NOT BE LIABLE FOR
          INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR
          FOR LOST PROFITS, REVENUE, DATA, OR GOODWILL. OUR TOTAL LIABILITY FOR
          CLAIMS ARISING OUT OF THE SERVICE WILL NOT EXCEED THE AMOUNTS YOU PAID
          TO US FOR THE SERVICE IN THE THREE MONTHS BEFORE THE CLAIM.
        </p>
      </LegalSection>

      <LegalSection title="Indemnity">
        <p>
          You will defend and indemnify us against claims arising from your use
          of the Service, your content, or your violation of these Terms or
          applicable law.
        </p>
      </LegalSection>

      <LegalSection title="Termination">
        <p>
          You may stop using the Service at any time. We may suspend or
          terminate access for any reason, including breach of these Terms.
          Provisions that by their nature should survive will survive
          termination.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update these Terms by posting a revised version on this page.
          Continued use after changes become effective constitutes acceptance.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>
          These Terms are governed by the laws of the United States and the
          State of Delaware, without regard to conflict-of-law rules, unless
          mandatory local law provides otherwise. Courts in Delaware will have
          exclusive jurisdiction, except where prohibited.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these Terms:{" "}
          <a
            href="mailto:support@seedanceapi.us"
            className="text-accent hover:underline"
          >
            support@seedanceapi.us
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
