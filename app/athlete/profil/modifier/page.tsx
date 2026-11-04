"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, CreditCard, FileText, HeartPulse, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { uploadsApi } from "@/lib/api/endpoints";
import { extractApiError } from "@/lib/api-error";
import { useMyAthleteProfile, useUpdateAthleteDocuments, useUpdateMyAthlete } from "@/lib/hooks/athletes";
import { POIDS } from "@/lib/config";
import { toDateInput } from "@/lib/format";
import { cn, fullName, storageUrl } from "@/lib/utils";
import type { Athlete } from "@/lib/types";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Card, ErrorState, SkeletonList } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/controls";
import { FieldLabel, Input } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";
import { FilePick, formatSize } from "@/components/ui/file-pick";
import { Spinner } from "@/components/ui/spinner";
import { PhotoUploader } from "@/components/screens/photo-uploader";

type DocType = "licence" | "certificat";

export default function EditAthleteProfilePage() {
  const { data: athlete, isLoading, isError, refetch } = useMyAthleteProfile();
  const updateDocs = useUpdateAthleteDocuments();

  const [pendingDoc, setPendingDoc] = useState<{ type: DocType; file: File } | null>(null);
  const [uploadingDoc, setUploadingDoc] = useState<DocType | null>(null);

  const confirmDoc = async () => {
    if (!pendingDoc || !athlete) return;
    const { type, file } = pendingDoc;
    setUploadingDoc(type);
    try {
      const url = await uploadsApi.document(file, {
        model: "athlete",
        model_id: athlete.id,
        collection: type === "licence" ? "licence" : "certificat_medical",
      });
      await updateDocs.mutateAsync(type === "licence" ? { licence_url: url } : { certificat_medical_url: url });
      setPendingDoc(null);
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setUploadingDoc(null);
    }
  };

  if (isLoading) return <SkeletonList count={3} className="p-4 md:p-8" />;
  if (isError || !athlete) return <ErrorState onRetry={() => refetch()} className="pt-16" />;

  const busyDoc = uploadingDoc !== null || updateDocs.isPending;

  return (
    <>
      <PageHeader title="Modifier le profil" backHref="/athlete/profil" size="lg" />
      <PageContainer size="lg" className="mt-4 grid grid-cols-1 gap-6 md:mt-0 lg:grid-cols-2">
        <InfoForm key={athlete.id} athlete={athlete} />

        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-bold text-white">Documents officiels</h2>
          <p className="mb-5 text-sm text-muted">PDF uniquement · 10 Mo max. Vous pourrez vérifier avant d&apos;envoyer.</p>
          <div className="space-y-3">
            <DocCard
              icon={<CreditCard />}
              label="Licence sportive"
              url={storageUrl(athlete.licence_url)}
              uploading={uploadingDoc === "licence"}
              onPick={(file) => setPendingDoc({ type: "licence", file })}
            />
            <DocCard
              icon={<HeartPulse />}
              label="Certificat médical"
              url={storageUrl(athlete.certificat_medical_url)}
              uploading={uploadingDoc === "certificat"}
              onPick={(file) => setPendingDoc({ type: "certificat", file })}
            />
          </div>
        </Card>
      </PageContainer>

      <Dialog
        open={!!pendingDoc}
        onClose={() => !busyDoc && setPendingDoc(null)}
        title={pendingDoc?.type === "licence" ? "Licence sportive" : "Certificat médical"}
        size="sm"
        footer={
          <>
            <Button variant="subtle" fullWidth disabled={busyDoc} onClick={() => setPendingDoc(null)}>
              Annuler
            </Button>
            <Button fullWidth loading={busyDoc} onClick={confirmDoc}>
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
                <p className="line-clamp-2 text-sm font-semibold text-white">{pendingDoc.file.name}</p>
                <p className="text-xs text-muted">{formatSize(pendingDoc.file.size)} · PDF</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted">Vérifiez qu&apos;il s&apos;agit bien du bon fichier avant d&apos;envoyer.</p>
          </>
        )}
      </Dialog>
    </>
  );
}

/** Infos personnelles : formulaire monté avec le profil chargé */
function InfoForm({ athlete }: { athlete: Athlete }) {
  const qc = useQueryClient();
  const update = useUpdateMyAthlete();
  const [sexe, setSexe] = useState<"M" | "F">(athlete.sexe ?? "M");
  const [categorie, setCategorie] = useState(athlete.categorie_poids ?? "");
  const [naissance, setNaissance] = useState(toDateInput(athlete.date_naissance));
  const name = fullName(athlete.user ?? athlete);

  return (
        <Card className="p-5 sm:p-6">
          <div className="mb-6 flex items-center gap-4">
            <PhotoUploader
              src={athlete.user?.photo_url ?? athlete.photo_url}
              name={name}
              model="athlete"
              modelId={athlete.id}
              onUploaded={() => qc.invalidateQueries({ queryKey: ["athleteMe"] })}
            />
            <div>
              <p className="font-bold text-white">{name}</p>
              <p className="text-xs text-muted">JPG ou PNG · 10 Mo max.</p>
            </div>
          </div>

          <FieldLabel>Sexe</FieldLabel>
          <div className="mb-5 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Sexe">
            {([["M", "Masculin"], ["F", "Féminin"]] as const).map(([v, l]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={sexe === v}
                onClick={() => setSexe(v)}
                className={cn(
                  "h-12 rounded-md border-[1.5px] text-sm font-semibold transition-colors",
                  sexe === v ? "border-primary bg-primary/12 text-primary" : "border-line bg-ink/40 text-muted hover:text-white",
                )}
              >
                {l}
              </button>
            ))}
          </div>

          <Input label="Date de naissance" type="date" value={naissance} max={toDateInput(new Date().toISOString())} onChange={(e) => setNaissance(e.target.value)} />

          <FieldLabel>Catégorie de poids</FieldLabel>
          <div className="mb-6 flex flex-wrap gap-2">
            {POIDS.map((p) => (
              <Chip key={p} active={categorie === p} onClick={() => setCategorie(p)}>
                {p}
              </Chip>
            ))}
          </div>

          <Button
            size="lg"
            fullWidth
            loading={update.isPending}
            onClick={() => update.mutate({ sexe, categorie_poids: categorie || undefined, date_naissance: naissance || undefined })}
          >
            Enregistrer les infos
          </Button>
        </Card>

  );
}

function DocCard({
  icon, label, url, uploading, onPick,
}: {
  icon: React.ReactNode; label: string; url?: string; uploading: boolean; onPick: (f: File) => void;
}) {
  const has = !!url;
  return (
    <div className="flex items-center gap-3 rounded-md border border-line bg-ink/40 p-3.5">
      <span className={cn("grid size-11 shrink-0 place-items-center rounded-md [&_svg]:size-5", has ? "bg-secondary/20 text-secondary-light" : "bg-surface-3 text-muted")}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-white">{label}</p>
        <p className={cn("flex items-center gap-1 text-xs", has ? "text-secondary-light" : "text-muted")}>
          {uploading ? "Envoi en cours…" : has ? (<><CheckCircle2 className="size-3.5" /> Document chargé</>) : "Aucun document"}
        </p>
      </div>
      {has && !uploading && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-muted hover:text-white">
          Voir
        </a>
      )}
      <FilePick
        accept="application/pdf"
        onFiles={(f) => onPick(f[0])}
        disabled={uploading}
        label={has ? `Remplacer : ${label}` : `Ajouter : ${label}`}
        className="grid size-10 place-items-center rounded-full text-primary hover:bg-primary/10"
      >
        {uploading ? <Spinner className="size-5" /> : has ? <RefreshCw className="size-5" /> : <Upload className="size-5" />}
      </FilePick>
    </div>
  );
}
