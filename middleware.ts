import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware de protección para /admin.
 *
 * Esta implementación usa una contraseña simple en cookie.
 * En producción, sustitúyela por NextAuth, Clerk o Auth.js.
 *
 * Para hacer login: POST /api/admin/login con { password: "..." }
 * Para hacer logout: DELETE /api/admin/login
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Solo proteger rutas /admin
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  // Comprobar cookie de sesión admin
  const adminSession = req.cookies.get("admin_session");
  const validSession = adminSession?.value === process.env.ADMIN_SESSION_TOKEN;

  if (!validSession) {
    // Redirigir a login
    const loginUrl = new URL("/admin/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
