"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { useDeleteCourse, useMyCourses } from "@/lib/hooks/courses";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/display";
import { LinkButton } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { useConfirm } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { CourseCard } from "@/components/domain/cards";

export default function MyCoursesPage() {
  const { data, isLoading, isError, refetch } = useMyCourses();
  const remove = useDeleteCourse();
  const confirm = useConfirm();
  const [tab, setTab] = useState<"avenir" | "passes">("avenir");

  const now = new Date();
  const all = data ?? [];
  const upcoming = all.filter((c) => new Date(c.date_fin) >= now).sort((a, b) => a.date_debut.localeCompare(b.date_debut));
  const past = all.filter((c) => new Date(c.date_fin) < now).sort((a, b) => b.date_debut.localeCompare(a.date_debut));
  const list = tab === "avenir" ? upcoming : past;

  const onDelete = async (id: string, titre: string) => {
    if (await confirm({ title: "Supprimer le cours", message: `Supprimer « ${titre} » ? Les réservations associées seront perdues.`, confirmLabel: "Supprimer", danger: true })) {
      remove.mutate(id);
    }
  };

  return (
    <>
      <PageHeader
        title="Mes Cours"
        subtitle={`${all.length} cours au total`}
        actions={
          <LinkButton href="/maitre/cours/nouveau" variant="secondary" size="sm" icon={<Plus className="size-4" />} className="hidden md:inline-flex">
            Créer un cours
          </LinkButton>
        }
      />
      <PageContainer className="mt-3 md:mt-0">
        <Segmented
            accent="secondary"
          className="mb-4"
          ariaLabel="Période"
          value={tab}
          onChange={setTab}
          options={[
            { value: "avenir", label: `À venir (${upcoming.length})` },
            { value: "passes", label: `Passés (${past.length})` },
          ]}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-36 rounded-lg" />)}</div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            message={tab === "avenir" ? "Aucun cours à venir" : "Aucun cours passé"}
            action={tab === "avenir" ? <LinkButton href="/maitre/cours/nouveau" variant="outline-secondary" size="sm">Créer un cours</LinkButton> : undefined}
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((c) => (
              <li key={c.id}>
                <CourseCard
                  course={c}
                  href={`/maitre/cours/${c.id}`}
                  trailing={
                    <button
                      type="button"
                      onClick={() => onDelete(c.id, c.titre)}
                      disabled={remove.isPending && remove.variables === c.id}
                      className="grid size-8 place-items-center rounded-full text-[#f87171] hover:bg-danger/15"
                      aria-label={`Supprimer ${c.titre}`}
                    >
                      {remove.isPending && remove.variables === c.id ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
                    </button>
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </PageContainer>

      {/* Bouton flottant (smartphone) */}
      <Link
        href="/maitre/cours/nouveau"
        className="fixed right-4 z-30 grid size-14 place-items-center rounded-full bg-secondary text-white shadow-[0_8px_24px_rgba(27,122,63,0.5)] transition-transform active:scale-95 md:hidden"
        style={{ bottom: "calc(var(--bottom-nav-h) + env(safe-area-inset-bottom) + 16px)" }}
        aria-label="Créer un cours"
      >
        <Plus className="size-7" />
      </Link>
    </>
  );
}
