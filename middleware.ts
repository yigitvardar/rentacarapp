import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Korumalı rotalar
const protectedRoutes = ["/dashboard", "/profile", "/packages", "/payment"];
const adminRoutes = ["/admin"];
const authRoutes = ["/login", "/register"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session;

  // Admin rotaları: Giriş yapılmış + ADMIN rolü gerekli
  if (adminRoutes.some((r) => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Korumalı rotalar: Giriş gerekli
  if (protectedRoutes.some((r) => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${pathname}`, req.url)
      );
    }
    return NextResponse.next();
  }

  // Auth rotaları: Giriş yapılmışsa yönlendir
  if (authRoutes.includes(pathname) && isLoggedIn) {
    if (session?.user?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Middleware hangi rotalarda çalışsın
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
