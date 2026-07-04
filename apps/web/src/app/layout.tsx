import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Instrument_Serif } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { Providers } from "@/components/providers";
import { getClerkPublishableKey } from "@/lib/clerk-key";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

const siteUrl = "https://seedanceapi.us";
const title = "SeedanceAPI — SeedDance & Seedream Models";
const description =
  "REST API for SeedDance 2.5 video and Seedream 5.0 image generation. Pay as you go, MCP support, and agent-ready docs.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s | SeedanceAPI",
  },
  description,
  applicationName: "SeedanceAPI",
  keywords: [
    "SeedDance",
    "Seedream",
    "video generation API",
    "image generation API",
    "AI video API",
    "text to video",
    "text to image",
    "MCP",
    "SeedanceAPI",
  ],
  authors: [{ name: "SeedanceAPI", url: siteUrl }],
  creator: "SeedanceAPI",
  publisher: "SeedanceAPI",
  category: "technology",
  alternates: {
    canonical: siteUrl,
    types: {
      "text/plain": [
        { url: "/llms.txt", title: "llms.txt" },
        { url: "/llms-full.txt", title: "llms-full.txt" },
      ],
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "SeedanceAPI",
    title,
    description,
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
        alt: "SeedanceAPI",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SeedanceAPI",
    description:
      "REST API for SeedDance video and Seedream image generation.",
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${siteUrl}/#organization`,
      name: "SeedanceAPI",
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
      description,
    },
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: siteUrl,
      name: "SeedanceAPI",
      description,
      publisher: { "@id": `${siteUrl}/#organization` },
      inLanguage: "en-US",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${siteUrl}/#app`,
      name: "SeedanceAPI",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
      url: siteUrl,
      description,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Pay as you go prepaid balance",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const publishableKey = getClerkPublishableKey();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
    >
      <body className="min-h-screen bg-paper font-sans antialiased text-ink">
        <Providers publishableKey={publishableKey}>
          <JsonLd data={jsonLd} />
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
