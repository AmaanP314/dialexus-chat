import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/chat", "/dashboard", "/explorer"];
const PUBLIC_ROUTES = ["/login"];
const API_BASE_URL = "http://localhost:8000/api/v1";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.headers.get("cookie");

  // --- Logic for users who are already logged in ---
  if (cookie) {
    try {
      const response = await fetch(`${API_BASE_URL}/users/me`, {
        headers: { cookie: cookie || "" },
      });

      if (response.ok) {
        const user = await response.json();
        const isAdmin = user.type === "admin" || user.type === "super_admin";

        // If a logged-in user tries to access the login page, redirect them away
        if (PUBLIC_ROUTES.some((path) => pathname.startsWith(path))) {
          return NextResponse.redirect(
            new URL(isAdmin ? "/dashboard" : "/chat", request.url)
          );
        }

        // If a regular user tries to access the dashboard, redirect to chat
        if (pathname.startsWith("/dashboard") && !isAdmin) {
          return NextResponse.redirect(new URL("/chat", request.url));
        }

        // *** CORRECTED: Handle the redirect from the root path after login ***
        if (pathname === "/") {
          return NextResponse.redirect(
            new URL(isAdmin ? "/dashboard" : "/chat", request.url)
          );
        }

        return NextResponse.next();
      }
    } catch (error) {
      console.error("Middleware API check failed:", error);
    }
  }

  // --- Logic for users who are not logged in ---
  if (!cookie && PROTECTED_ROUTES.some((path) => pathname.startsWith(path))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
