"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Bell, CalendarDays, ChevronRight, LogOut, Mail, Shield, UserCog, Users } from "lucide-react";
import { useAuthStore } from "@/lib/stores";
import { useLogout } from "@/lib/hooks/auth";
import { useMyClub } from "@/lib/hooks/clubs";
import { CLUB_STATUS } from "@/lib/config";
import { fullName } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Badge, Card, GradeChip, SectionTitle } from "@/components/ui/display";
import { useConfirm } from "@/components/ui/dialog";
import { ClubLogo } from "@/components/domain/cards";
import { PhotoUploader } from "@/components/screens/photo-uploader";

export default function MaitreProfilePage() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const confirm = useConfirm();
  const club = useMyClub();
  const c = club.data;

  const onLogout = async () => {
    if (await confirm({ title: "Déconnexion", message: "Voulez-vous vraiment vous déconnecter ?", confirmLabel: "Déconnecter", danger: true })) logout();
  };

  return (
    <>
      <PageHeader title="Profil" size="lg" />
      <PageContainer size="lg" className="mt-4 grid grid-cols-1 gap-6 md:mt-0 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="flex flex-col items-center p-6 text-center">
            <PhotoUploader src={user?.photo_url} name={fullName(user)} model="user" modelId={user?.id} />
            <p className="mt-3 text-xl font-extrabold text-white">{fullName(user)}</p>
            <p className="text-sm break-all text-muted">{user?.email ?? user?.identifiant}</p>
            {user?.grade && <GradeChip grade={user.grade} dan={user.dan} className="mt-3" />}
            <span className="mt-3 rounded-full bg-secondary/20 px-3 py-1 text-xs font-bold text-secondary-light">Maître de salle</span>
          </Card>
          {c && (
            <Link href="/maitre/club" className="flex items-center gap-3 rounded-lg bg-surface p-4 hover:bg-surface-2">
              <ClubLogo club={c} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-white">{c.nom}</p>
                <Badge label={CLUB_STATUS[c.statut].label} color={CLUB_STATUS[c.statut].color} size="sm" className="mt-1" />
              </div>
              <ChevronRight className="size-5 text-muted" />
            </Link>
          )}
        </div>

        <nav aria-label="Menu du profil">
          <SectionTitle>Raccourcis et paramètres</SectionTitle>
          <Card className="divide-y divide-line p-0">
            <MenuLink href="/maitre/club" icon={<Shield />} label="Mon club" />
            <MenuLink href="/maitre/cours" icon={<CalendarDays />} label="Mes cours" />
            <MenuLink href="/maitre/athletes" icon={<Users />} label="Mes athlètes" />
            <MenuLink href="/maitre/athletes/invitations" icon={<Mail />} label="Invitations" />
            <MenuLink href="/maitre/notifications" icon={<Bell />} label="Notifications" />
            <MenuLink href="/maitre/profil/notifications" icon={<Bell />} label="Préférences notifications" />
            <MenuLink href="/maitre/profil/compte" icon={<UserCog />} label="Mon profil, ma ceinture et mot de passe" />
            <button type="button" onClick={onLogout} className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-[15px] font-medium text-[#f87171] hover:bg-danger/10">
              <LogOut className="size-5" /> Se déconnecter
            </button>
          </Card>
        </nav>
      </PageContainer>
    </>
  );
}

function MenuLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-white/5">
      <span className="text-muted [&_svg]:size-5">{icon}</span>
      <span className="flex-1">{label}</span>
      <ChevronRight className="size-[18px] text-line" />
    </Link>
  );
}
