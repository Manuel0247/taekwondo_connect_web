"use client";

import { Suspense, useEffect, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn, fullName } from "@/lib/utils";
import { useAuthStore, useNotifStore } from "@/lib/stores";
import { useUnreadNotificationsCount } from "@/lib/hooks/misc";
import { useLogout } from "@/lib/hooks/auth";
import { homeForRole } from "@/lib/session";
import { Avatar } from "../ui/display";
import { useConfirm } from "../ui/dialog";
import { activeHref, NAV, type NavItem } from "./nav-config";

type ShellRole = "athlete" | "maitre_salle";

/**
 * Coquille applicative responsive :
 *  - < 768 px : barre d'onglets en bas (fidèle au mobile), zone de sécurité respectée
 *  - 768–1023 px : rail d'icônes latéral
 *  - ≥ 1024 px : barre latérale complète (logo, navigation, raccourcis, compte)
 */
export function AppShell({ role, children }: { role: ShellRole; children: ReactNode }) {
  const router = useRouter();
  const { hydrated, token, role: userRole, logoutReason } = useAuthStore();

  // Garde côté client (le proxy protège déjà au chargement ; ceci couvre l'expiration en cours de session)
  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace(logoutReason === "expired" ? "/connexion?session=expiree" : "/connexion");
    } else if (userRole && userRole !== role) {
      router.replace(homeForRole(userRole));
    }
  }, [hydrated, token, userRole, role, logoutReason, router]);

  const ready = hydrated && !!token && userRole === role;
  useUnreadNotificationsCount(ready);

  // La session vit dans le navigateur : le rendu serveur s'arrête à l'écran de démarrage.
  // Le chemin courant (onglet actif) est lu sous Suspense, comme l'exige Cache Components.
  if (!ready) return <SplashScreen />;
  return (
    <Suspense fallback={<SplashScreen />}>
      <ShellLayout role={role}>{children}</ShellLayout>
    </Suspense>
  );
}

function ShellLayout({ role, children }: { role: ShellRole; children: ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const unread = useNotifStore((s) => s.unreadCount);
  const logout = useLogout();
  const confirm = useConfirm();
  const nav = NAV[role];

  const all = [...nav.primary, ...nav.secondary];
  const current = activeHref(pathname, all);
  const accentText = nav.accent === "secondary" ? "text-secondary-light" : "text-primary";
  const accentBg = nav.accent === "secondary" ? "bg-secondary/15" : "bg-primary/12";
  const accentBar = nav.accent === "secondary" ? "bg-secondary-light" : "bg-primary";

  const onLogout = async () => {
    if (await confirm({ title: "Déconnexion", message: "Voulez-vous vraiment vous déconnecter ?", confirmLabel: "Déconnecter", danger: true })) {
      logout();
    }
  };

  const badgeFor = (it: NavItem) =>
    it.badge === "notifications" && unread > 0 ? (
      <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[10px] font-bold text-white">
        {unread > 9 ? "9+" : unread}
      </span>
    ) : null;

  return (
    <div className="min-h-dvh md:pl-[96px] lg:pl-[264px]">
      {/* ── Barre latérale (tablette : rail ; desktop : complète) ─────────── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[96px] flex-col border-r border-line bg-ink md:flex lg:w-[264px]">
        <Link href={nav.primary[0].href} className="flex h-20 items-center gap-3 px-4 lg:px-5" aria-label="Accueil LCC Taekwondo">
          <Image src="/images/logo.png" alt="" width={52} height={52} className="size-[52px] shrink-0 rounded-md" priority />
          <div className="hidden leading-tight lg:block">
            <p className="text-[15px] font-extrabold text-white">LCC Taekwondo</p>
            <p className={cn("text-xs font-semibold", accentText)}>{nav.roleLabel}</p>
          </div>
        </Link>

        <nav className="no-scrollbar flex-1 overflow-y-auto px-1.5 py-2 lg:px-3" aria-label="Navigation principale">
          <ul className="space-y-1">
            {nav.primary.map((it) => (
              <SideLink key={it.href} item={it} active={current === it.href} accentText={accentText} accentBg={accentBg} accentBar={accentBar} />
            ))}
          </ul>
          <p className="mt-6 mb-2 hidden px-3 text-[11px] font-bold tracking-wider text-muted uppercase lg:block">Raccourcis</p>
          <div className="mx-auto my-4 h-px w-8 bg-line lg:hidden" />
          <ul className="space-y-1">
            {nav.secondary.map((it) => (
              <SideLink key={it.href} item={it} active={current === it.href} accentText={accentText} accentBg={accentBg} accentBar={accentBar} badge={badgeFor(it)} dot={it.badge === "notifications" && unread > 0} />
            ))}
          </ul>
        </nav>

        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-md p-2 lg:bg-surface">
            <Avatar src={user?.photo_url} name={fullName(user)} size={40} className="mx-auto lg:mx-0" />
            <div className="hidden min-w-0 flex-1 lg:block">
              <p className="truncate text-sm font-bold text-white">{fullName(user)}</p>
              <p className="truncate text-xs text-muted">{user?.email ?? user?.identifiant}</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="hidden size-9 place-items-center rounded-full text-muted hover:bg-danger/15 hover:text-[#f87171] lg:grid"
              aria-label="Se déconnecter"
              title="Se déconnecter"
            >
              <LogOut className="size-[18px]" />
            </button>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="mx-auto mt-2 grid size-10 place-items-center rounded-full text-muted hover:bg-danger/15 hover:text-[#f87171] lg:hidden"
            aria-label="Se déconnecter"
            title="Se déconnecter"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </aside>

      {/* ── Contenu ───────────────────────────────────────────────────────── */}
      <div className="content-bottom-space min-w-0">{children}</div>

      {/* ── Barre d'onglets mobile ────────────────────────────────────────── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 backdrop-blur-md pb-safe md:hidden"
        aria-label="Navigation principale"
      >
        <ul className="flex h-[var(--bottom-nav-h)]">
          {nav.primary.map((it) => {
            const active = current === it.href;
            const Icon = it.icon;
            return (
              <li key={it.href} className="flex-1">
                <Link
                  href={it.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-full flex-col items-center justify-center gap-1 text-[10.5px] font-semibold transition-colors xs:text-[11px]",
                    active ? accentText : "text-muted",
                  )}
                >
                  <span className="relative">
                    <Icon className="size-6" strokeWidth={active ? 2.2 : 1.8} />
                  </span>
                  <span className="max-w-full truncate px-0.5">{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function SideLink({
  item, active, accentText, accentBg, accentBar, badge, dot,
}: {
  item: NavItem; active: boolean; accentText: string; accentBg: string; accentBar: string; badge?: ReactNode; dot?: boolean;
}) {
  const Icon = item.icon;
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        title={item.label}
        className={cn(
          "group relative flex flex-col items-center gap-1 rounded-md px-1 py-2.5 text-[10.5px] leading-tight font-semibold transition-colors lg:flex-row lg:gap-3 lg:px-3 lg:text-sm",
          active ? cn(accentBg, accentText) : "text-muted hover:bg-white/5 hover:text-white",
        )}
      >
        {active && <span className={cn("absolute inset-y-2 left-0 hidden w-[3px] rounded-r-full lg:block", accentBar)} />}
        <span className="relative">
          <Icon className="size-[22px] lg:size-5" strokeWidth={active ? 2.2 : 1.8} />
          {dot && <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-ink bg-danger lg:hidden" />}
        </span>
        <span className="line-clamp-2 max-w-full text-center break-words lg:truncate lg:text-left">{item.label}</span>
        <span className="hidden lg:contents">{badge}</span>
      </Link>
    </li>
  );
}

export function SplashScreen() {
  // Écran de démarrage (logo LCC sur fond noir, fondu) — repris du splash mobile
  return (
    <div className="grid min-h-dvh place-items-center bg-ink" role="status" aria-label="Chargement">
      <Image src="/images/logo.png" alt="LCC Taekwondo" width={180} height={180} className="animate-pulse" priority />
    </div>
  );
}
