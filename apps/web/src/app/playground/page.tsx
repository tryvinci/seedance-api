import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PlaygroundClient } from "./playground-client";

export const metadata: Metadata = {
  title: "Playground",
  description: "Try SeedDance video and Seedream image models in the browser.",
  robots: { index: false, follow: false },
};

export default async function PlaygroundPage() {
  const { userId } = await auth();
  if (!userId) redirect("/dashboard");

  return <PlaygroundClient />;
}
