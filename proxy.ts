import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const { pathname } = request.nextUrl;

    // Routes publiques : auth et API d'authentification
    if (pathname.startsWith("/auth") || pathname.startsWith("/api/auth")) {
      if (session?.user) {
        const redirectUrl = session.user.role === "WFM" 
          ? "/wfm/dashboard" 
          : "/jury/dashboard";
        return NextResponse.redirect(new URL(redirectUrl, request.url));
      }
      return NextResponse.next();
    }

    // Routes protégées : nécessitent une session
    if (!session?.user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Contrôle d'accès par rôle
    if (pathname.startsWith("/wfm") && session.user.role !== "WFM") {
      return NextResponse.redirect(new URL("/jury/dashboard", request.url));
    }

    if (pathname.startsWith("/jury") && session.user.role !== "JURY") {
      return NextResponse.redirect(new URL("/wfm/dashboard", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("[proxy] Erreur :", error);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}

// Configure les routes où le proxy s'applique
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};   