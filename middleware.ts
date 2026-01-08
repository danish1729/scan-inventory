import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // 1. Initialize Response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // 2. Initialize Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // 3. SECURE AUTH CHECK
  // We use getUser() which validates the JWT signature on the server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- A. PUBLIC ROUTES CHECK ---
  // If not logged in and trying to access protected pages, kick to login
  if (!user && request.nextUrl.pathname !== "/login") {
    const protectedPaths = ["/dashboard", "/scan", "/products", "/staff"];
    if (
      protectedPaths.some((path) =>
        request.nextUrl.pathname.startsWith(path)
      ) ||
      request.nextUrl.pathname === "/"
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // --- B. ROLE-BASED ACCESS CONTROL (RBAC) ---
  if (user) {
    // 1. Fetch Real-Time Role from Database
    // This makes it "Very Secure" because it checks the DB, not just the cookie.
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role || "staff"; // Default to lowest privilege if DB read fails

    // 2. Define Restricted Zones
    const currentPath = request.nextUrl.pathname;

    // RULE 1: STAFF cannot access Admin Areas
    if (role === "staff") {
      const staffForbiddenPaths = [
        "/dashboard", // Owner Overview
        "/staff", // Staff Management
        "/products/add", // Creating Products
      ];

      // If staff tries to hit a forbidden path, force them to Scanner
      if (staffForbiddenPaths.some((path) => currentPath.startsWith(path))) {
        return NextResponse.redirect(new URL("/scan", request.url));
      }

      // If staff hits root URL, send to Scanner
      if (currentPath === "/") {
        return NextResponse.redirect(new URL("/scan", request.url));
      }
    }

    // RULE 2: Redirect logged-in users away from Login page
    if (currentPath === "/login") {
      if (role === "owner") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } else {
        return NextResponse.redirect(new URL("/scan", request.url));
      }
    }

    // RULE 3: Handling Root "/" for Owners
    if (role === "owner" && currentPath === "/") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes are protected by RLS, middleware just handles Pages)
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
