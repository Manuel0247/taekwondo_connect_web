import { NextResponse, type NextRequest } from "next/server";

// Protection des espaces par rôle (équivalent de l'AuthGuard de app/_layout.tsx du mobile).
// Les cookies sont posés côté navigateur à la connexion (lib/session.ts).
const TOKEN_COOKIE = "lcc_web_token";
const ROLE_COOKIE = "lcc_web_role";

const AUTH_PAGES = ["/connexion", "/inscription", "/mot-de-passe-oublie", "/reinitialisation"];

function home(role?: string) {
  if (role === "athlete") return "/athlete";
  if (role === "maitre_salle") return "/maitre";
  return null;
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const token = request.cookies.get(TOKEN_COOKIE)?.value;
  const role = request.cookies.get(ROLE_COOKIE)?.value;
  const roleHome = token ? home(role) : null;

  const redirect = (to: string) => NextResponse.redirect(new URL(to, request.url));

  if (pathname === "/") return redirect(roleHome ?? "/connexion");

  const isAthlete = pathname === "/athlete" || pathname.startsWith("/athlete/");
  const isMaitre = pathname === "/maitre" || pathname.startsWith("/maitre/");

  if (isAthlete || isMaitre) {
    if (!roleHome) {
      const login = new URL("/connexion", request.url);
      login.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(login);
    }
    // Un athlète ne peut pas ouvrir l'espace maître et inversement
    if ((isAthlete && role !== "athlete") || (isMaitre && role !== "maitre_salle")) return redirect(roleHome);
  }

  if (roleHome && AUTH_PAGES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return redirect(roleHome);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|images/|icon|favicon|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"],
};
