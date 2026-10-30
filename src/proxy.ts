// src/proxy.ts next.js usa proxy somente nada de midllewere
import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
  "/dashboard", 
  "/usuarios", 
  "/tecnicos", 
  "/servicos", 
  "/relatorios", 
  "/agendamentos"
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("auth_session");
  const isAuthenticated = !!session;

  // Protege rotas - se não tem auth, vai para /
  if (protectedRoutes.some((route) => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Se está autenticado e acessa / ou /login, vai para /dashboard
  // ⚠️ IMPORTANTE: Não redirecione se já estiver em /dashboard para evitar loop
  if ((pathname === "/" || pathname === "/login") && isAuthenticated) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};