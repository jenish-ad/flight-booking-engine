import type { Metadata } from "next";
import { redirect } from "next/navigation";

import AuthForm from "@/components/auth/auth-form";
import { getCurrentUser } from "@/lib/api/server";
import { safeNext } from "@/lib/auth/safe-next";

export const metadata: Metadata = { title: "Voyage | Create account" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const next = safeNext((await searchParams).next);
  if (await getCurrentUser().catch(() => null)) redirect(next);
  return <AuthForm mode="register" next={next} />;
}
