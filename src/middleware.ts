import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
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

  // ── Protect /farmer routes ───────────────────────────────────────────────
  if (path.startsWith("/farmer")) {
    if (!user) {
      return NextResponse.redirect(
        new URL(`/auth/login?next=${encodeURIComponent(path)}`, request.url)
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarded")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarded) {
      return NextResponse.redirect(
        new URL(`/auth/onboard?next=${encodeURIComponent(path)}`, request.url)
      );
    }

    if (profile.role !== "farmer") {
      return NextResponse.redirect(new URL("/buyer", request.url));
    }
  }

  // ── Protect /buyer routes ────────────────────────────────────────────────
  if (path.startsWith("/buyer")) {
    if (!user) {
      return NextResponse.redirect(
        new URL(`/auth/login?next=${encodeURIComponent(path)}`, request.url)
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarded")
      .eq("id", user.id)
      .single();

    if (!profile?.onboarded) {
      return NextResponse.redirect(
        new URL(`/auth/onboard?next=${encodeURIComponent(path)}`, request.url)
      );
    }

    if (profile.role !== "buyer") {
      return NextResponse.redirect(new URL("/farmer", request.url));
    }
  }

  // ── Redirect already-logged-in users away from auth pages ───────────────
  if (path.startsWith("/auth/login") && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, onboarded")
      .eq("id", user.id)
      .single();

    if (profile?.onboarded) {
      return NextResponse.redirect(
        new URL(profile.role === "farmer" ? "/farmer" : "/buyer", request.url)
      );
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/farmer/:path*", "/buyer/:path*", "/auth/login"],
};
