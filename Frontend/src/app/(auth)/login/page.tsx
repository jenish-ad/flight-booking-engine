import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AuthForm from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/api/server";
import { safeNext } from "@/lib/auth/safe-next";

export const metadata: Metadata = { title: "Voyage | Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser().catch(() => null)) redirect(next);
  return <AuthForm mode="login" next={next} />;
}
