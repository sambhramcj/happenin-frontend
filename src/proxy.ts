import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function proxy(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If no token, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }

    const role = (token as any)?.role;

    // Role-based route protection
    if (path.startsWith("/dashboard/student")) {
      if (role !== "student") {
        // Redirect to their correct dashboard
        if (role === "organizer") {
          return NextResponse.redirect(new URL("/dashboard/organizer", req.url));
        } else if (role === "admin") {
          return NextResponse.redirect(new URL("/dashboard/admin", req.url));
        }
        return NextResponse.redirect(new URL("/auth", req.url));
      }
    } else if (path.startsWith("/dashboard/organizer")) {
      if (role !== "organizer") {
        // Redirect to their correct dashboard
        if (role === "student") {
          return NextResponse.redirect(new URL("/dashboard/student", req.url));
        } else if (role === "admin") {
          return NextResponse.redirect(new URL("/dashboard/admin", req.url));
        }
        return NextResponse.redirect(new URL("/auth", req.url));
      }
    } else if (path.startsWith("/dashboard/admin")) {
      if (role !== "admin") {
        // Redirect to their correct dashboard
        if (role === "student") {
          return NextResponse.redirect(new URL("/dashboard/student", req.url));
        } else if (role === "organizer") {
          return NextResponse.redirect(new URL("/dashboard/organizer", req.url));
        }
        return NextResponse.redirect(new URL("/auth", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to dashboard routes only if token exists
        const path = req.nextUrl.pathname;
        if (path.startsWith("/dashboard")) {
          return !!token;
        }
        return true; // Allow other routes
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
  ],
};

