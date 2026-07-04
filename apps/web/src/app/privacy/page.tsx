import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How SeedanceAPI collects, uses, and protects your information.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const UPDATED = "July 4, 2026";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated={UPDATED}>
      <p>
        This Privacy Policy describes how SeedanceAPI (&quot;we&quot;,
        &quot;us&quot;, or &quot;our&quot;) collects, uses, and shares
        information when you use seedanceapi.us, api.seedanceapi.us, and related
        services (the &quot;Service&quot;).
      </p>

      <LegalSection title="Information we collect">
        <p>
          <strong className="text-ink">Account information.</strong> When you
          sign up, we receive identifiers and profile data from our
          authentication provider (for example, email address, name, and user
          ID).
        </p>
        <p>
          <strong className="text-ink">Billing information.</strong> Payments
          are processed by our payment provider. We receive payment status,
          amounts, and transaction identifiers. We do not store full card
          numbers on our servers.
        </p>
        <p>
          <strong className="text-ink">Usage data.</strong> We log API requests,
          model selections, generation status, timestamps, approximate usage
          amounts, and technical metadata (such as IP address, user agent, and
          error codes) needed to operate and secure the Service.
        </p>
        <p>
          <strong className="text-ink">Content you submit.</strong> Prompts,
          media uploads, and other inputs you send to the API are processed to
          fulfill your requests and may be stored temporarily for delivery,
          debugging, abuse prevention, and billing reconciliation.
        </p>
      </LegalSection>

      <LegalSection title="How we use information">
        <p>We use information to:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Provide, maintain, and improve the Service</li>
          <li>Authenticate users and manage API keys</li>
          <li>Process payments and maintain prepaid balances</li>
          <li>Monitor abuse, fraud, and security incidents</li>
          <li>Comply with law and enforce our Terms of Service</li>
          <li>Communicate service-related notices</li>
        </ul>
      </LegalSection>

      <LegalSection title="Sharing">
        <p>
          We share information with service providers that help us run the
          Service, including authentication, payments, hosting, and model
          inference providers. Those providers process data on our behalf under
          their own terms and privacy policies. We may disclose information if
          required by law or to protect the rights, safety, and integrity of the
          Service and our users.
        </p>
        <p>We do not sell your personal information.</p>
      </LegalSection>

      <LegalSection title="Data retention">
        <p>
          We retain account, billing, and usage records for as long as your
          account is active and as needed for legitimate business, tax, and
          legal purposes. Generation inputs and outputs may be retained for a
          limited period for delivery and operational needs, then deleted or
          de-identified according to our retention practices.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We use reasonable technical and organizational measures to protect
          information. No method of transmission or storage is completely
          secure; you use the Service at your own risk.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You may update account details through your account provider, manage
          API keys in the dashboard, and request account deletion by contacting
          us. Some records may be retained where we have a legal or legitimate
          business need to do so.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          The Service is not directed to children under 13 (or the minimum age
          required in your jurisdiction). We do not knowingly collect personal
          information from children.
        </p>
      </LegalSection>

      <LegalSection title="International transfers">
        <p>
          We may process information in the United States and other countries
          where we or our providers operate. By using the Service, you
          understand that your information may be transferred to those
          locations.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update this policy from time to time. We will post the updated
          version on this page and revise the &quot;Last updated&quot; date.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about this policy:{" "}
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
