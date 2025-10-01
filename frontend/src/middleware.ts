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

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/chat", "/dashboard", "/explorer"];
const PUBLIC_ROUTES = ["/login"];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Store refresh promises per cookie to prevent multiple simultaneous refresh attempts
const refreshPromises = new Map<string, Promise<boolean>>();

const refreshAccessToken = async (cookie: string): Promise<boolean> => {
  try {
    const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        cookie: cookie,
      },
      credentials: "include",
    });

    return refreshResponse.ok;
  } catch (error) {
    console.error("Token refresh failed:", error);
    return false;
  }
};

const apiFetch = async (
  url: string,
  cookie: string,
  options: RequestInit = {}
): Promise<Response> => {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers: {
      ...options.headers,
      cookie: cookie,
    },
    credentials: "include",
  });

  // If we get 401, try to refresh the token
  if (response.status === 401) {
    // Check if there's already a refresh in progress for this cookie
    let refreshPromise = refreshPromises.get(cookie);

    if (!refreshPromise) {
      // Create a new refresh promise
      refreshPromise = refreshAccessToken(cookie);
      refreshPromises.set(cookie, refreshPromise);

      // Clean up the promise after it completes
      refreshPromise.finally(() => {
        refreshPromises.delete(cookie);
      });
    }

    // Wait for the refresh to complete
    const refreshSuccess = await refreshPromise;

    if (refreshSuccess) {
      // Retry the original request with the same cookie
      // The Set-Cookie headers from refresh will be handled by the browser
      return await fetch(`${API_BASE_URL}${url}`, {
        ...options,
        headers: {
          ...options.headers,
          cookie: cookie,
        },
        credentials: "include",
      });
    }
  }

  return response;
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = request.headers.get("cookie") || "";
  const hasAccessToken = cookie.includes("access_token");
  const hasRefreshToken = cookie.includes("refresh_token");

  // If user has tokens (access or refresh), try to authenticate
  if (hasAccessToken || hasRefreshToken) {
    try {
      const response = await apiFetch("/users/me", cookie);

      if (response.ok) {
        const user = await response.json();
        const isAdmin = user.type === "admin" || user.type === "super_admin";

        // Create a NextResponse to potentially set new cookies
        let nextResponse: NextResponse;

        // If a logged-in user tries to access the login page, redirect them away
        if (PUBLIC_ROUTES.some((path) => pathname.startsWith(path))) {
          nextResponse = NextResponse.redirect(
            new URL(isAdmin ? "/dashboard" : "/chat", request.url)
          );
        }
        // If a regular user tries to access the dashboard, redirect to chat
        else if (pathname.startsWith("/dashboard") && !isAdmin) {
          nextResponse = NextResponse.redirect(new URL("/chat", request.url));
        }
        // If admin tries to access /chat, redirect to /dashboard/chat
        else if (pathname.startsWith("/chat") && isAdmin) {
          nextResponse = NextResponse.redirect(
            new URL("/dashboard/chat", request.url)
          );
        }
        // Handle the redirect from the root path after login
        else if (pathname === "/") {
          nextResponse = NextResponse.redirect(
            new URL(isAdmin ? "/dashboard" : "/chat", request.url)
          );
        } else {
          nextResponse = NextResponse.next();
        }

        // Forward any Set-Cookie headers from the API response (like refreshed tokens)
        const setCookieHeader = response.headers.get("set-cookie");
        if (setCookieHeader) {
          nextResponse.headers.set("set-cookie", setCookieHeader);
        }

        return nextResponse;
      } else {
        // If the request failed even after refresh attempt, redirect to login
        console.log("Authentication failed, redirecting to login");
        const response = NextResponse.redirect(new URL("/login", request.url));

        // Clear the cookies
        response.cookies.delete("access_token");
        response.cookies.delete("refresh_token");

        return response;
      }
    } catch (error) {
      console.error("Middleware API check failed:", error);
      // On error, redirect to login and clear cookies
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
      return response;
    }
  }

  // --- Logic for users who are not logged in or have no tokens ---
  if (
    !hasAccessToken &&
    !hasRefreshToken &&
    PROTECTED_ROUTES.some((path) => pathname.startsWith(path))
  ) {
    console.log("No tokens found, redirecting to login");
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
