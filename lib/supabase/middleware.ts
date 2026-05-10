import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_ROUTES = ["/", "/login"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Helper to copy session cookies onto a redirect
  const redirectWithSession = (toPath: string) => {
    const url = request.nextUrl.clone();
    url.pathname = toPath;
    const redirect = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(c =>
      redirect.cookies.set(c.name, c.value, c)
    );
    return redirect;
  };

  // Not authed + protected route -> /login
  if (!user && !PUBLIC_ROUTES.includes(path) && !path.startsWith("/auth")) {
    return redirectWithSession("/login");
  }

  // Authed + on /login or / -> /hq
  if (user && (path === "/login" || path === "/")) {
    return redirectWithSession("/hq");
  }

  return supabaseResponse;
}
