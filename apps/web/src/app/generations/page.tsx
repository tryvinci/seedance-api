import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { GenerationsClient } from "./generations-client";

export const metadata: Metadata = {
  title: "Generations",
  robots: { index: false, follow: false },
};

export default async function GenerationsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=/generations");

  return <GenerationsClient />;
}
