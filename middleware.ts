import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/packages",
  "/payment",
  "/tc-verify",
  "/vehicles",
  "/invoice",
  "/policy",
];
const adminRoutes = ["/admin"];
const authRoutes = ["/login", "/register"];

// Open redirect engelleyelim — sadece kendi domaine relative path'e izin ver
function isSafeCallbackUrl(url: string): boolean {
  try {
    if (url.startsWith("//") || url.includes("://")) return false;
    if (!url.startsWith("/")) return false;
    const decoded = decodeURIComponent(url).toLowerCase();
    if (decoded.startsWith("javascript:") || decoded.startsWith("data:")) return false;
    return true;
  } catch {
    return false;
  }
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const isLoggedIn = !!session;

  // Admin rotaları
  if (adminRoutes.some((r) => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Korumalı rotalar
  if (protectedRoutes.some((r) => pathname.startsWith(r))) {
    if (!isLoggedIn) {
      const safeCallback = isSafeCallbackUrl(pathname) ? pathname : "/dashboard";
      return NextResponse.redirect(
        new URL(`/login?callbackUrl=${encodeURIComponent(safeCallback)}`, req.url)
      );
    }
    return NextResponse.next();
  }

  // Auth rotaları: giriş yapılmışsa yönlendir
  if (authRoutes.includes(pathname) && isLoggedIn) {
    if (session?.user?.role === "ADMIN") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|public).*)"],
};
