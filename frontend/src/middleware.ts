// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// const PROTECTED_ROUTES = ["/chat", "/dashboard", "/explorer"];
// const PUBLIC_ROUTES = ["/login"];
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// let isRefreshing = false;

// const apiFetch = async (
//   url: string,
//   options: RequestInit = {}
// ): Promise<Response> => {
//   options.credentials = "include";
//   let response = await fetch(`${API_BASE_URL}${url}`, options);

//   if (response.status === 401 && !isRefreshing) {
//     isRefreshing = true;
//     try {
//       const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
//         method: "POST",
//         credentials: "include",
//       });
//       if (refreshResponse.ok) {
//         response = await fetch(`${API_BASE_URL}${url}`, options);
//       }
//     } finally {
//       isRefreshing = false;
//     }
//   }
//   return response;
// };

// export async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;
//   const cookie = request.headers.get("cookie");
//   const hasAccessToken = cookie && cookie.includes("access_token");

//   if (hasAccessToken) {
//     try {
//       const response = await apiFetch("/users/me", {
//         headers: { cookie: cookie || "" },
//       });

//       if (response.ok) {
//         const user = await response.json();
//         const isAdmin = user.type === "admin" || user.type === "super_admin"; // If a logged-in user tries to access the login page, redirect them away

//         if (PUBLIC_ROUTES.some((path) => pathname.startsWith(path))) {
//           return NextResponse.redirect(
//             new URL(isAdmin ? "/dashboard" : "/chat", request.url)
//           );
//         }
//         // If a regular user tries to access the dashboard, redirect to chat
//         if (pathname.startsWith("/dashboard") && !isAdmin) {
//           return NextResponse.redirect(new URL("/chat", request.url));
//         }
//         if (pathname.startsWith("/chat") && isAdmin) {
//           return NextResponse.redirect(new URL("/dashboard/chat", request.url));
//         }
//         // Handle the redirect from the root path after login
//         if (pathname === "/") {
//           return NextResponse.redirect(
//             new URL(isAdmin ? "/dashboard" : "/chat", request.url)
//           );
//         }

//         return NextResponse.next();
//       }
//     } catch (error) {
//       console.error("Middleware API check failed:", error);
//     }
//   }
//   // --- Logic for users who are not logged in or have no access token ---
//   if (
//     !hasAccessToken &&
//     PROTECTED_ROUTES.some((path) => pathname.startsWith(path))
//   ) {
//     console.log("No access token found, redirecting to login.");
//     return NextResponse.redirect(new URL("/login", request.url));
//   }

//   if (pathname === "/") {
//     return NextResponse.redirect(new URL("/login", request.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
// };

// chat-frontend/src/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/chat", "/dashboard", "/explorer"];
const PUBLIC_ROUTES = ["/login"];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Executes a fetch, and attempts to refresh the token and retry on a 401.
 * IMPORTANT: This logic is local to the middleware and does NOT use api.ts.
 */
async function validateAndRefresh(
  request: NextRequest,
  cookieHeader: string
): Promise<{
  ok: boolean;
  response: Response | null;
  newCookie?: string | null;
}> {
  // 1. Initial check for user details
  let response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: { cookie: cookieHeader },
  });

  if (response.ok) {
    return { ok: true, response };
  }

  // 2. If 401, attempt token refresh
  if (response.status === 401) {
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { cookie: cookieHeader },
    });

    // 3. If refresh was successful
    if (refreshResponse.ok) {
      // *** MODIFICATION START ***
      // Capture the new 'Set-Cookie' header from the refresh response
      const newCookie = refreshResponse.headers.get("Set-Cookie");
      // *** MODIFICATION END ***

      // 4. Retry the original request
      const retryResponse = await fetch(`${API_BASE_URL}/users/me`, {
        // Use the original cookie header for the retry, as the browser doesn't have the new one yet
        headers: { cookie: cookieHeader },
      });

      if (retryResponse.ok) {
        // Token was successfully refreshed and the request succeeded
        // Return the successful response AND the new cookie to be set
        return { ok: true, response: retryResponse, newCookie };
      }
    }
  }

  // Failed initial check and failed refresh
  return { ok: false, response: null };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookieHeader = request.headers.get("cookie") || "";
  const hasAccessToken = cookieHeader && cookieHeader.includes("access_token");

  // --- 1. Attempt Authentication and Authorization (Token is present) ---
  if (hasAccessToken) {
    const isProtected = PROTECTED_ROUTES.some((path) =>
      pathname.startsWith(path)
    );

    // Only attempt validation if the user is hitting a protected or root path
    if (isProtected || pathname === "/") {
      const { ok, response, newCookie } = await validateAndRefresh(
        request,
        cookieHeader
      );

      if (ok && response) {
        // --- AUTHENTICATION SUCCESS ---
        const user = await response.json();
        const isAdmin = user.type === "admin" || user.type === "super_admin";
        const defaultPath = isAdmin ? "/dashboard" : "/chat";

        let finalResponse: NextResponse;

        // If authenticated user hits / or /login, redirect to their default path
        if (
          pathname === "/" ||
          PUBLIC_ROUTES.some((path) => pathname.startsWith(path))
        ) {
          finalResponse = NextResponse.redirect(
            new URL(defaultPath, request.url)
          );
        }
        // Role-based redirects for protected routes
        else if (pathname.startsWith("/dashboard") && !isAdmin) {
          finalResponse = NextResponse.redirect(new URL("/chat", request.url));
        } else if (pathname.startsWith("/chat") && isAdmin) {
          finalResponse = NextResponse.redirect(
            new URL("/dashboard/chat", request.url)
          );
        } else {
          finalResponse = NextResponse.next();
        }

        // *** MODIFICATION START ***
        // If a new cookie was generated from the refresh, set it on the final response
        if (newCookie) {
          finalResponse.headers.set("Set-Cookie", newCookie);
        }
        // *** MODIFICATION END ***

        return finalResponse;
      } else {
        // --- AUTHENTICATION FAILURE (Expired or Invalid) ---
        // If validation/refresh failed on a protected/root path, redirect to login.
        // Create a redirect response to clear the cookie
        const loginUrl = new URL("/login", request.url);
        const response = NextResponse.redirect(loginUrl);
        // Advise the browser to clear the cookie
        response.headers.set(
          "Set-Cookie",
          "access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
        );
        return response;
      }
    }
  }

  // --- 2. Handle Unauthenticated Users (No Token) ---
  if (
    !hasAccessToken &&
    (PROTECTED_ROUTES.some((path) => pathname.startsWith(path)) ||
      pathname === "/")
  ) {
    console.log("No access token found, redirecting to login.");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Allow access to other public/static files/routes.
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
