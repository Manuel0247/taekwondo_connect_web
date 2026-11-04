import {
  Bell, Building2, CalendarDays, CalendarRange, CircleUserRound, Heart, Home, LayoutGrid, Library, Mail,
  Shield, Trophy, Users, type LucideIcon,
} from "lucide-react";
import type { UserRole } from "@/lib/types";

export type NavItem = { href: string; label: string; icon: LucideIcon; badge?: "notifications" };

export type NavConfig = {
  /** Onglets principaux (barre d'onglets du mobile) */
  primary: NavItem[];
  /** Raccourcis visibles dans la barre latérale (écrans secondaires du mobile) */
  secondary: NavItem[];
  accent: "primary" | "secondary";
  roleLabel: string;
  notificationsHref: string;
};

// Onglets repris de app/(athlete)/_layout.tsx et app/(maitre)/_layout.tsx
export const NAV: Record<Exclude<UserRole, "admin">, NavConfig> = {
  athlete: {
    accent: "primary",
    roleLabel: "Athlète",
    notificationsHref: "/athlete/notifications",
    primary: [
      { href: "/athlete", label: "Accueil", icon: Home },
      { href: "/athlete/clubs", label: "Clubs", icon: Building2 },
      { href: "/athlete/evenements", label: "Événements", icon: Trophy },
      { href: "/athlete/techniques", label: "Techniques", icon: Library },
      { href: "/athlete/profil", label: "Profil", icon: CircleUserRound },
    ],
    secondary: [
      { href: "/athlete/calendrier", label: "Mon calendrier", icon: CalendarDays },
      { href: "/athlete/techniques/favoris", label: "Mes favoris", icon: Heart },
      { href: "/athlete/notifications", label: "Notifications", icon: Bell, badge: "notifications" },
    ],
  },
  maitre_salle: {
    accent: "secondary",
    roleLabel: "Maître de salle",
    notificationsHref: "/maitre/notifications",
    primary: [
      { href: "/maitre", label: "Dashboard", icon: LayoutGrid },
      { href: "/maitre/club", label: "Mon Club", icon: Shield },
      { href: "/maitre/cours", label: "Mes Cours", icon: CalendarDays },
      { href: "/maitre/evenements", label: "Événements", icon: Trophy },
      { href: "/maitre/athletes", label: "Athlètes", icon: Users },
      { href: "/maitre/profil", label: "Profil", icon: CircleUserRound },
    ],
    secondary: [
      { href: "/maitre/calendrier", label: "Calendrier", icon: CalendarRange },
      { href: "/maitre/athletes/invitations", label: "Invitations", icon: Mail },
      { href: "/maitre/notifications", label: "Notifications", icon: Bell, badge: "notifications" },
    ],
  },
};

/** Élément actif = préfixe le plus long correspondant au chemin courant */
export function activeHref(pathname: string, items: NavItem[]): string | null {
  let best: string | null = null;
  for (const it of items) {
    const match = pathname === it.href || pathname.startsWith(`${it.href}/`);
    if (match && (!best || it.href.length > best.length)) best = it.href;
  }
  return best;
}
