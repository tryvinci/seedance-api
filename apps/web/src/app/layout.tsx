import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { Instrument_Serif } from "next/font/google";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import "./globals.css";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://seedanceapi.us"),
  title: {
    default: "Seedance API — SeedDance & Seedream Models",
    template: "%s | Seedance API",
  },
  description:
    "State-of-the-art API for SeedDance 2.5 video and Seedream image generation. Prepaid credits, MCP support, and agent-ready documentation.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://seedanceapi.us",
    siteName: "Seedance API",
    title: "Seedance API — SeedDance & Seedream Models",
    description:
      "REST API for SeedDance video and Seedream image generation models.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Seedance API",
    description: "REST API for SeedDance video and Seedream image generation.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable}`}
      >
        <body className="min-h-screen bg-paper font-sans antialiased text-ink">
          <Header />
          <main>{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
