"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import {
  Banknote, Camera, FileText, Image as ImageIcon, MapPin, Pencil, Plus, Shield, Trash2, X, AlignLeft, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { uploadsApi } from "@/lib/api/endpoints";
import { extractApiError } from "@/lib/api-error";
import { useClubDocuments, useDeleteClubDocument, useMyClub, useUpdateClubPhotos, useUploadClubDocument } from "@/lib/hooks/clubs";
import { CLUB_STATUS, DISCIPLINE_LABELS, JOURS } from "@/lib/config";
import { capitalize, formatPrice, storageUrl, toNumber } from "@/lib/utils";
import type { Discipline } from "@/lib/types";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Badge, Card, ErrorState, InfoRow, SkeletonList, Tag } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Dialog, useConfirm } from "@/components/ui/dialog";
import { FilePick, formatSize } from "@/components/ui/file-pick";
import { Spinner, CenteredSpinner } from "@/components/ui/spinner";
import { ClubLogo } from "@/components/domain/cards";
import { LocationMap } from "@/components/maps";

export default function MyClubPage() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { data: club, isLoading, isError, refetch } = useMyClub();
  const updatePhotos = useUpdateClubPhotos();
  const docs = useClubDocuments();
  const uploadDoc = useUploadClubDocument();
  const deleteDoc = useDeleteClubDocument();
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(0);
  const [pendingDoc, setPendingDoc] = useState<File | null>(null);

  if (isLoading) return <SkeletonList count={4} className="p-4 md:p-8" />;
  if (isError || !club) return <ErrorState onRetry={() => refetch()} className="pt-16" />;

  const status = CLUB_STATUS[club.statut] ?? CLUB_STATUS.en_attente;
  const photos = club.photos_urls ?? [];
  const horaires = JOURS.filter((j) => club.horaires?.[j]);
  const lat = toNumber(club.latitude);
  const lng = toNumber(club.longitude);

  const pickLogo = async (file: File) => {
    setUploadingLogo(true);
    try {
      await uploadsApi.image(file, { model: "club", model_id: club.id, collection: "logo" });
      qc.invalidateQueries({ queryKey: ["myClub"] });
      toast.success("Logo mis à jour");
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setUploadingLogo(false);
    }
  };

  const addPhotos = async (files: File[]) => {
    setUploadingPhotos(files.length);
    try {
      // Envois successifs : chaque upload ajoute la photo à la galerie côté API
      for (const f of files) await uploadsApi.image(f, { model: "club", model_id: club.id, collection: "galerie" });
      toast.success(files.length > 1 ? "Photos ajoutées" : "Photo ajoutée");
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      qc.invalidateQueries({ queryKey: ["myClub"] });
      setUploadingPhotos(0);
    }
  };

  const removePhoto = async (url: string) => {
    if (await confirm({ title: "Supprimer", message: "Retirer cette photo de la galerie ?", confirmLabel: "Supprimer", danger: true })) {
      updatePhotos.mutate(photos.filter((u) => u !== url));
    }
  };

  const removeDoc = async (filename: string) => {
    if (await confirm({ title: "Supprimer", message: `Supprimer « ${filename} » ?`, confirmLabel: "Supprimer", danger: true })) {
      deleteDoc.mutate(filename);
    }
  };

  return (
    <>
      <PageHeader title="Mon Club" subtitle={club.nom} actions={<Badge label={status.long} color={status.color} size="sm" />} />
      <PageContainer className="mt-4 grid grid-cols-1 gap-6 md:mt-0 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          {/* Logo */}
          <Card className="flex items-center gap-4 p-5">
            <div className="relative">
              {uploadingLogo ? (
                <span className="grid size-24 place-items-center rounded-md bg-primary/12 text-primary">
                  <Spinner className="size-6" />
                </span>
              ) : (
                <ClubLogo club={club} size={96} />
              )}
              <FilePick
                accept="image/jpeg,image/png"
                onFiles={(f) => pickLogo(f[0])}
                disabled={uploadingLogo}
                label="Changer le logo"
                className="absolute -right-2 -bottom-2 grid size-9 place-items-center rounded-full border-2 border-surface bg-primary text-white hover:scale-105"
              >
                <Camera className="size-4" />
              </FilePick>
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white">Logo</h2>
              <p className="text-xs text-muted">Format carré recommandé · JPG ou PNG, 10 Mo max.</p>
              <FilePick
                accept="image/jpeg,image/png"
                onFiles={(f) => pickLogo(f[0])}
                disabled={uploadingLogo}
                className="mt-2 text-[13px] font-semibold text-primary hover:underline"
              >
                {club.logo_url ? "Changer le logo" : "Ajouter un logo"}
              </FilePick>
            </div>
          </Card>

          {/* Photos */}
          <Section title="Photos de la salle" right={<span className="text-xs text-muted">{photos.length} photo{photos.length !== 1 ? "s" : ""}</span>}>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 xl:grid-cols-5">
              {photos.map((url) => (
                <div key={url} className="group relative aspect-square overflow-hidden rounded-md bg-surface-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={storageUrl(url)} alt="" className="size-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute top-1.5 right-1.5 grid size-8 place-items-center rounded-full bg-ink/80 text-[#f87171] opacity-100 transition-opacity hover:bg-ink md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                    aria-label="Retirer la photo"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <FilePick
                accept="image/jpeg,image/png"
                multiple
                onFiles={addPhotos}
                disabled={uploadingPhotos > 0}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border-[1.5px] border-dashed border-primary/60 text-primary transition-colors hover:bg-primary/10"
              >
                {uploadingPhotos > 0 ? (
                  <>
                    <Spinner className="size-6" />
                    <span className="text-[11px]">Envoi ({uploadingPhotos})…</span>
                  </>
                ) : (
                  <>
                    <Plus className="size-7" />
                    <span className="text-xs font-semibold">Ajouter</span>
                  </>
                )}
              </FilePick>
            </div>
            {photos.length === 0 && uploadingPhotos === 0 && (
              <p className="mt-3 text-[13px] text-muted">Aucune photo — aidez les athlètes à découvrir votre salle.</p>
            )}
          </Section>

          {/* Informations */}
          <Section title="Informations" editHref="/maitre/club/infos">
            <Card className="py-2">
              <InfoRow icon={<Shield />} label="Nom" value={club.nom} />
              <InfoRow icon={<MapPin />} label="Adresse" value={`${club.adresse}, ${club.ville}${club.code_postal ? ` (${club.code_postal})` : ""}`} />
              {club.description && <InfoRow icon={<AlignLeft />} label="Description" value={<span className="font-normal">{club.description}</span>} />}
              {formatPrice(club.prix_mensuel) && <InfoRow icon={<Banknote />} label="Prix mensuel" value={formatPrice(club.prix_mensuel)} />}
              {formatPrice(club.prix_annuel) && <InfoRow icon={<Banknote />} label="Prix annuel" value={formatPrice(club.prix_annuel)} />}
              {!!club.disciplines?.length && (
                <div className="flex flex-wrap gap-2 py-2">
                  {club.disciplines.map((d) => <Tag key={d} label={DISCIPLINE_LABELS[d as Discipline] ?? d} color="#F5A05C" />)}
                </div>
              )}
            </Card>
          </Section>

          {/* Documents */}
          <Section
            title="Documents"
            right={
              <FilePick
                accept="application/pdf,image/jpeg,image/png"
                onFiles={(f) => setPendingDoc(f[0])}
                className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3 text-xs font-bold text-white hover:bg-[#d65c08]"
              >
                <Plus className="size-3.5" /> Ajouter
              </FilePick>
            }
          >
            {docs.isLoading ? (
              <CenteredSpinner className="py-6" />
            ) : (docs.data ?? []).length === 0 ? (
              <p className="rounded-lg bg-surface p-4 text-[13px] text-muted">Aucun document — ajoutez vos fiches d&apos;inscription, règlement, etc.</p>
            ) : (
              <ul className="space-y-2">
                {docs.data!.map((d) => {
                  const pdf = d.filename.toLowerCase().endsWith(".pdf");
                  const busy = deleteDoc.isPending && deleteDoc.variables === d.filename;
                  return (
                    <li key={d.path} className="flex items-center gap-3 rounded-md bg-surface p-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-primary/12 text-primary">
                        {pdf ? <FileText className="size-5" /> : <ImageIcon className="size-5" />}
                      </span>
                      <a
                        href={storageUrl(d.url) ?? storageUrl(d.path)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 flex-1 truncate text-sm font-semibold text-white hover:underline"
                      >
                        {d.filename}
                      </a>
                      <ExternalLink className="hidden size-4 text-muted sm:block" />
                      <button
                        type="button"
                        onClick={() => removeDoc(d.filename)}
                        disabled={busy}
                        className="grid size-9 place-items-center rounded-full text-[#f87171] hover:bg-danger/10"
                        aria-label={`Supprimer ${d.filename}`}
                      >
                        {busy ? <Spinner className="size-4" /> : <Trash2 className="size-[18px]" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>
        </div>

        {/* Colonne latérale */}
        <aside className="space-y-6">
          <Section title="Horaires" editHref="/maitre/club/horaires">
            {horaires.length ? (
              <Card className="divide-y divide-line p-0">
                {horaires.map((j) => (
                  <div key={j} className="flex justify-between px-4 py-2.5 text-sm">
                    <span className="text-muted">{capitalize(j)}</span>
                    <span className="font-semibold text-white">{club.horaires![j]}</span>
                  </div>
                ))}
              </Card>
            ) : (
              <p className="rounded-lg bg-surface p-4 text-[13px] text-muted">Aucun horaire configuré</p>
            )}
          </Section>

          <Section title="Équipements" editHref="/maitre/club/equipements">
            {club.equipements?.length ? (
              <div className="flex flex-wrap gap-2">
                {club.equipements.map((e) => <Tag key={e} label={capitalize(e)} />)}
              </div>
            ) : (
              <p className="rounded-lg bg-surface p-4 text-[13px] text-muted">Aucun équipement renseigné</p>
            )}
          </Section>

          {lat !== null && lng !== null && (
            <Section title="Localisation" editHref="/maitre/club/infos">
              <LocationMap latitude={lat} longitude={lng} title={club.nom} className="h-56" />
            </Section>
          )}
        </aside>
      </PageContainer>

      <Dialog
        open={!!pendingDoc}
        onClose={() => !uploadDoc.isPending && setPendingDoc(null)}
        title="Envoyer ce document ?"
        size="sm"
        footer={
          <>
            <Button variant="subtle" fullWidth disabled={uploadDoc.isPending} onClick={() => setPendingDoc(null)}>
              Annuler
            </Button>
            <Button fullWidth loading={uploadDoc.isPending} onClick={() => pendingDoc && uploadDoc.mutate(pendingDoc, { onSuccess: () => setPendingDoc(null) })}>
              Envoyer
            </Button>
          </>
        }
      >
        {pendingDoc && (
          <>
            <div className="flex items-center gap-3 rounded-md bg-ink/50 p-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-md bg-primary/12 text-primary">
                <FileText className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-semibold text-white">{pendingDoc.name}</p>
                <p className="text-xs text-muted">{formatSize(pendingDoc.size)}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">Vérifiez qu&apos;il s&apos;agit bien du bon fichier avant d&apos;envoyer.</p>
          </>
        )}
      </Dialog>
    </>
  );
}

function Section({ title, editHref, right, children }: { title: string; editHref?: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[17px] font-bold text-white">{title}</h2>
        {editHref ? (
          <Link href={editHref} className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline" aria-label={`Modifier : ${title}`}>
            <Pencil className="size-4" /> Modifier
          </Link>
        ) : (
          right
        )}
      </div>
      {children}
    </section>
  );
}
