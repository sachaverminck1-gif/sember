// Protection des routes (convention "proxy" de Next 16, ex-middleware) :
// tout ce qui n'est pas public exige un cookie de session.
// La vérification fine (session valide, paywall) se fait côté serveur dans
// src/lib/session.ts — le proxy est un premier barrage rapide.
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = ["/", "/connexion", "/inscription"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Routes publiques et assets : on laisse passer.
  if (
    PUBLIC_PATHS.includes(pathname) ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/inscription") ||
    pathname.startsWith("/api/stripe/webhook") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // NextAuth v5 : cookie "authjs.session-token" (ou "__Secure-..." en HTTPS).
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/connexion";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // On exclut les fichiers statiques ; tout le reste passe par le proxy.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
