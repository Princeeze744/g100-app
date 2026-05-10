"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function sendMagicLink({
  email,
  fullName,
}: {
  email: string;
  fullName: string;
}) {
  if (!email) return { error: "Email is required" };

  const supabase = await createClient();
  const headersList = await headers();
  const host = headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const origin = `${proto}://${host}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      data: fullName.trim() ? { full_name: fullName.trim() } : undefined,
    },
  });

  if (error) return { error: error.message };
  return { success: true };
}
