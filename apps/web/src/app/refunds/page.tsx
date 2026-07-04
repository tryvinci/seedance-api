import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Refund and prepaid balance policy for SeedanceAPI.",
  alternates: { canonical: "/refunds" },
  robots: { index: true, follow: true },
};

const UPDATED = "July 4, 2026";

export default function RefundsPage() {
  return (
    <LegalPage title="Refund Policy" updated={UPDATED}>
      <p>
        This Refund Policy explains how prepaid balances and payments work on
        SeedanceAPI. It forms part of our{" "}
        <Link href="/terms" className="text-accent hover:underline">
          Terms of Service
        </Link>
        .
      </p>

      <LegalSection title="Prepaid balance">
        <p>
          SeedanceAPI is a prepaid service. When you add funds, we credit your
          account balance in USD. Balance is used to pay for API usage at the
          published model rates. Unused balance remains on your account until it
          is consumed, your account is closed, or we are required to act
          otherwise by law.
        </p>
      </LegalSection>

      <LegalSection title="General rule">
        <p>
          <strong className="text-ink">
            Payments for prepaid balance are generally non-refundable
          </strong>
          , including unused balance, except where required by law or as
          described below.
        </p>
      </LegalSection>

      <LegalSection title="When we may refund">
        <p>We may issue a refund or credit, at our discretion, if:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            You were charged due to a clear billing or system error on our side
          </li>
          <li>
            A purchase failed to credit your balance and payment was still
            captured
          </li>
          <li>
            We permanently discontinue the Service and you have unused prepaid
            balance
          </li>
          <li>Applicable consumer law requires a refund</li>
        </ul>
        <p>
          Refunds, when granted, are typically returned to the original payment
          method and may take several business days to appear, depending on your
          bank or payment provider.
        </p>
      </LegalSection>

      <LegalSection title="What we do not refund">
        <p>Unless required by law, we do not refund:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Balance already spent on successful or attempted generations</li>
          <li>
            Dissatisfaction with model outputs, quality, latency, or creative
            results
          </li>
          <li>
            Usage that failed because of invalid inputs, policy violations, or
            your integration errors
          </li>
          <li>
            Requests for cash-out or transfer of unused balance to another
            account
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Failed or partial generations">
        <p>
          If a generation fails due to an error on our side and you were
          charged, we will ordinarily credit the charge back to your prepaid
          balance automatically or upon review. Charges for completed
          generations are final.
        </p>
      </LegalSection>

      <LegalSection title="Chargebacks">
        <p>
          If you initiate a chargeback or payment dispute, we may suspend your
          account while we investigate. Fraudulent disputes may result in
          permanent termination.
        </p>
      </LegalSection>

      <LegalSection title="How to request a refund">
        <p>
          Email{" "}
          <a
            href="mailto:support@seedanceapi.us"
            className="text-accent hover:underline"
          >
            support@seedanceapi.us
          </a>{" "}
          with your account email, payment date, amount, and a brief description
          of the issue. We aim to respond within a few business days.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          We may update this policy by posting a revised version on this page.
          The &quot;Last updated&quot; date will change when we do.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
