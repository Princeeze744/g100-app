import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (process.env.NODE_ENV !== "development") {
    return new NextResponse("Not available in production", { status: 404 });
  }

  const url = new URL(request.url);
  const email = url.searchParams.get("email");
  if (!email) {
    return NextResponse.json(
      { error: "Add ?email=you@example.com to the URL" },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const tokenHash = data.properties?.hashed_token;
  if (!tokenHash) {
    return NextResponse.json({ error: "No token generated" }, { status: 500 });
  }

  const confirmUrl = `${url.origin}/auth/confirm?token_hash=${tokenHash}&type=magiclink&next=/hq`;
  return NextResponse.redirect(confirmUrl);
}
