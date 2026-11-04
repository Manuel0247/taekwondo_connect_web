"use client";

import { useState } from "react";
import { AlertCircle, ExternalLink, Heart, PersonStanding, PlayCircle } from "lucide-react";
import { useFavoriteIds, useTechniqueDetail, useToggleFavorite } from "@/lib/hooks/techniques";
import { COURSE_LEVELS, DISCIPLINE_LABELS } from "@/lib/config";
import { capitalize, cn, storageUrl } from "@/lib/utils";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Badge, ErrorState, SkeletonList, Tag } from "@/components/ui/display";
import { buttonClass } from "@/components/ui/button";

type VideoKind = "player" | "youtube" | "external";

function videoKind(url: string): VideoKind {
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/vimeo\.com|dailymotion\.com|facebook\.com\/.*\/videos/i.test(url)) return "external";
  return "player";
}

function youtubeId(url: string) {
  return url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/)?.[1] ?? null;
}

export function TechniqueDetail({ id }: { id: string }) {
  const { data: t, isLoading, isError, refetch } = useTechniqueDetail(id);
  const favIds = useFavoriteIds();
  const toggle = useToggleFavorite();
  const [videoError, setVideoError] = useState(false);

  if (isLoading) return <SkeletonList count={2} className="p-4 md:p-8" />;
  if (isError || !t) {
    return (
      <PageContainer className="pt-8">
        <ErrorState message="Technique introuvable" onRetry={() => refetch()} />
      </PageContainer>
    );
  }

  const isFav = favIds.has(t.id);
  const video = t.video_url ? (storageUrl(t.video_url) ?? t.video_url) : undefined;
  const kind = video ? videoKind(video) : null;
  const ytId = kind === "youtube" && video ? youtubeId(video) : null;
  const illustration = storageUrl(t.illustration_url);
  const niveau = COURSE_LEVELS[t.niveau] ?? COURSE_LEVELS.debutant;

  const media =
    kind === "player" && video && !videoError ? (
      <video
        src={video}
        controls
        playsInline
        preload="metadata"
        poster={illustration}
        onError={() => setVideoError(true)}
        className="aspect-video w-full bg-black"
      >
        Votre navigateur ne peut pas lire cette vidéo.
      </video>
    ) : kind === "youtube" && ytId ? (
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${ytId}`}
        title={`Vidéo : ${t.nom_fr}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full bg-black"
      />
    ) : (kind === "external" || kind === "youtube") && video ? (
      <a
        href={video}
        target="_blank"
        rel="noopener noreferrer"
        className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-surface text-center hover:bg-surface-2"
      >
        <PlayCircle className="size-14 text-primary" strokeWidth={1.5} />
        <span className="font-bold text-white">Vidéo externe</span>
        <span className="inline-flex items-center gap-1 text-sm text-muted">
          Ouvrir dans un nouvel onglet <ExternalLink className="size-3.5" />
        </span>
      </a>
    ) : illustration ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={illustration} alt={t.nom_fr} className="aspect-video w-full bg-surface object-contain" />
    ) : (
      <div className="grid aspect-video w-full place-items-center bg-surface text-muted">
        <PersonStanding className="size-20" strokeWidth={1.3} />
      </div>
    );

  return (
    <>
      <PageHeader
        title={t.nom_fr}
        subtitle={t.nom_korean ?? undefined}
        backHref="/athlete/techniques"
        size="lg"
        actions={
          <button
            type="button"
            onClick={() => toggle.mutate({ id: t.id, isFavori: isFav })}
            disabled={toggle.isPending}
            aria-pressed={isFav}
            aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
            className="grid size-11 place-items-center rounded-full border border-line bg-surface hover:bg-surface-3"
          >
            <Heart className={cn("size-5", isFav ? "fill-danger text-danger" : "text-white")} />
          </button>
        }
      />
      <PageContainer size="lg" className="mt-4 grid grid-cols-1 gap-6 md:mt-0 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="-mx-4 overflow-hidden sm:mx-0 sm:rounded-xl sm:border sm:border-line">{media}</div>
          {videoError && (
            <div className="mt-3 flex items-center gap-3 rounded-md bg-surface p-3 text-sm">
              <AlertCircle className="size-5 shrink-0 text-muted" />
              <span className="flex-1 text-muted">Vidéo temporairement indisponible dans le lecteur.</span>
              {video && (
                <a href={video} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">
                  Ouvrir
                </a>
              )}
            </div>
          )}
          {t.description && <p className="mt-6 text-[15px] leading-relaxed whitespace-pre-line text-white/85">{t.description}</p>}
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg bg-surface p-5">
            <p className="text-2xl font-extrabold text-white">{t.nom_fr}</p>
            {t.nom_korean && <p className="mt-1 text-lg font-semibold text-primary-light">{t.nom_korean}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge label={niveau.label} color={niveau.color} />
              <Tag label={DISCIPLINE_LABELS[t.discipline] ?? t.discipline} />
              <Tag label={capitalize(t.type.replace(/_/g, " "))} color="#8E8E93" />
            </div>
          </div>
          {illustration && kind && !videoError && (
            <div className="rounded-lg bg-surface p-3">
              <p className="mb-2 text-xs font-bold tracking-wide text-muted uppercase">Illustration</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={illustration} alt="" className="w-full rounded-md object-cover" />
            </div>
          )}
          {kind === "player" && video && !videoError && (
            <a href={video} target="_blank" rel="noopener noreferrer" download className={buttonClass({ variant: "subtle", fullWidth: true })}>
              <ExternalLink className="size-4" />
              Ouvrir / télécharger la vidéo
            </a>
          )}
        </aside>
      </PageContainer>
    </>
  );
}
