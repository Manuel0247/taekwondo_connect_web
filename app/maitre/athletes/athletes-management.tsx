"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Mail, Search, UserPlus, Users } from "lucide-react";
import { useClubAthletes, useClubAthletesPending } from "@/lib/hooks/athletes";
import { formatShortDate } from "@/lib/format";
import type { Athlete } from "@/lib/types";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Avatar, EmptyState, ErrorState, GradeChip, SkeletonList } from "@/components/ui/display";
import { LinkButton } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { AthleteRow, athleteName } from "@/components/domain/cards";
import { PendingActions } from "@/components/screens/pending-actions";

type Tab = "valides" | "attente";

export function AthletesManagement() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab: Tab = params.get("onglet") === "attente" ? "attente" : "valides";
  const [q, setQ] = useState("");

  const valid = useClubAthletes();
  const pending = useClubAthletesPending();
  const current = tab === "valides" ? valid : pending;
  const list = (current.data ?? []).filter((a) => !q || athleteName(a).toLowerCase().includes(q.toLowerCase()));

  const setTab = (t: Tab) => router.replace(t === "attente" ? `${pathname}?onglet=attente` : pathname, { scroll: false });

  return (
    <>
      <PageHeader
        title="Athlètes"
        subtitle="Membres et demandes d'adhésion de votre club"
        actions={
          <>
            <LinkButton href="/maitre/athletes/invitations" variant="subtle" size="sm" icon={<Mail className="size-4 text-primary" />}>
              <span className="hidden sm:inline">Invitations</span>
            </LinkButton>
            <LinkButton href="/maitre/athletes/nouveau" variant="secondary" size="sm" icon={<UserPlus className="size-4" />}>
              <span className="hidden sm:inline">Ajouter</span>
            </LinkButton>
          </>
        }
      />
      <PageContainer className="mt-3 md:mt-0">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Segmented
            accent="secondary"
            ariaLabel="Statut des athlètes"
            value={tab}
            onChange={setTab}
            className="w-full sm:w-auto"
            options={[
              { value: "valides", label: `Validés (${valid.data?.length ?? "…"})` },
              {
                value: "attente",
                label: `En attente (${pending.data?.length ?? "…"})`,
                badge: (pending.data?.length ?? 0) > 0 ? <span className="size-2 rounded-full bg-warning" /> : undefined,
              },
            ]}
          />
          <label className="flex h-11 items-center gap-2 rounded-md border border-line bg-surface px-3 focus-within:border-secondary sm:w-72">
            <Search className="size-4 text-muted" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher un athlète…"
              aria-label="Rechercher un athlète"
              className="h-full min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-muted focus:outline-none"
            />
          </label>
        </div>

        {current.isLoading ? (
          <SkeletonList count={4} />
        ) : current.isError ? (
          <ErrorState onRetry={() => current.refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={Users}
            message={q ? "Aucun athlète ne correspond" : tab === "valides" ? "Aucun athlète validé" : "Aucune demande en attente"}
            action={tab === "valides" && !q ? <LinkButton href="/maitre/athletes/invitations" variant="outline-secondary" size="sm">Inviter des athlètes</LinkButton> : undefined}
          />
        ) : (
          <>
            {/* Smartphone / tablette : cartes */}
            <ul className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:hidden">
              {list.map((a) => (
                <li key={a.id} className={tab === "attente" ? "rounded-lg bg-surface p-2" : undefined}>
                  <AthleteRow athlete={a} href={`/maitre/athletes/${a.id}`} showDate className={tab === "attente" ? "bg-transparent" : undefined} />
                  {tab === "attente" && (
                    <div className="px-2 pt-1 pb-1">
                      <PendingActions athlete={a} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
            {/* Desktop : tableau */}
            <AthletesTable athletes={list} pending={tab === "attente"} />
          </>
        )}
      </PageContainer>
    </>
  );
}

function AthletesTable({ athletes, pending }: { athletes: Athlete[]; pending: boolean }) {
  return (
    <div className="hidden overflow-hidden rounded-lg border border-line lg:block">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface text-xs font-semibold tracking-wide text-muted uppercase">
          <tr>
            <th scope="col" className="px-4 py-3">Athlète</th>
            <th scope="col" className="px-4 py-3">Grade</th>
            <th scope="col" className="px-4 py-3">Catégorie</th>
            <th scope="col" className="px-4 py-3">Licence</th>
            <th scope="col" className="px-4 py-3">Inscrit le</th>
            <th scope="col" className="px-4 py-3 text-right">{pending ? "Décision" : <span className="sr-only">Ouvrir</span>}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {athletes.map((a) => {
            const expired = a.licence_expiration && new Date(a.licence_expiration) < new Date();
            return (
              <tr key={a.id} className="bg-ink transition-colors hover:bg-surface/60">
                <td className="px-4 py-3">
                  <Link href={`/maitre/athletes/${a.id}`} className="flex items-center gap-3 font-semibold text-white hover:underline">
                    <Avatar src={a.user?.photo_url ?? a.photo_url} name={athleteName(a)} size={36} />
                    <span className="min-w-0">
                      <span className="block truncate">{athleteName(a)}</span>
                      <span className="block truncate text-xs font-normal text-muted">{a.user?.email ?? a.user?.identifiant}</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3"><GradeChip grade={a.grade} /></td>
                <td className="px-4 py-3 text-muted">{a.categorie_poids ?? "—"}</td>
                <td className="px-4 py-3">
                  {a.numero_licence ? (
                    <span className={expired ? "text-[#f87171]" : "text-white"}>
                      {a.numero_licence}
                      {expired && <span className="block text-[11px]">Expirée</span>}
                    </span>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted">{a.created_at ? formatShortDate(a.created_at) : "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    {pending ? (
                      <PendingActions athlete={a} compact />
                    ) : (
                      <Link href={`/maitre/athletes/${a.id}`} className="grid size-9 place-items-center rounded-full text-muted hover:bg-white/5 hover:text-white" aria-label={`Ouvrir ${athleteName(a)}`}>
                        <ChevronRight className="size-5" />
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
