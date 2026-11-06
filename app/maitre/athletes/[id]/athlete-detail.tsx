"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, Check, Copy, ExternalLink, FileText, KeyRound, Pencil, UserMinus, Upload, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { uploadsApi } from "@/lib/api/endpoints";
import { extractApiError } from "@/lib/api-error";
import {
  useAthleteDetail, useRemoveAthlete, useResetAthletePassword, useUpdateAthleteDocsByMaitre, useUpdateAthleteGrade, useUpdateAthleteLicenceByMaitre,
} from "@/lib/hooks/athletes";
import { DANS, GRADES, GRADE_COLORS, GRADE_LABELS, danLabel, gradeAccent } from "@/lib/config";
import { formatDate, toDateInput } from "@/lib/format";
import { cn, storageUrl } from "@/lib/utils";
import type { CreatedAccount, Grade } from "@/lib/types";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Avatar, Card, ErrorState, GradeChip, InfoRow, SkeletonList } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Dialog, useConfirm } from "@/components/ui/dialog";
import { Input } from "@/components/ui/field";
import { FilePick } from "@/components/ui/file-pick";
import { Spinner } from "@/components/ui/spinner";
import { athleteName } from "@/components/domain/cards";
import { GradeProgress } from "@/components/domain/grades";

type DocType = "licence" | "certificat";

export function AthleteDetail({ id }: { id: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { data: athlete, isLoading, isError, refetch } = useAthleteDetail(id);
  const updateGrade = useUpdateAthleteGrade();
  const remove = useRemoveAthlete();
  const resetPassword = useResetAthletePassword();
  const [newCreds, setNewCreds] = useState<CreatedAccount | null>(null);
  const updateDocs = useUpdateAthleteDocsByMaitre(id);
  const updateLicence = useUpdateAthleteLicenceByMaitre(id);

  const [gradeOpen, setGradeOpen] = useState(false);
  // Ceinture noire choisie : on demande ensuite le dan
  const [choixDan, setChoixDan] = useState(false);
  const fermerGrade = () => { setGradeOpen(false); setChoixDan(false); };
  const [licenceOpen, setLicenceOpen] = useState(false);
  const [numLicence, setNumLicence] = useState("");
  const [expiration, setExpiration] = useState("");
  const [uploading, setUploading] = useState<DocType | null>(null);

  if (isLoading) return <SkeletonList count={3} className="p-4 md:p-8" />;
  if (isError || !athlete) return <ErrorState message="Athlète introuvable" onRetry={() => refetch()} className="pt-16" />;

  const name = athleteName(athlete);

  const openLicence = () => {
    setNumLicence(athlete.numero_licence ?? "");
    setExpiration(toDateInput(athlete.licence_expiration));
    setLicenceOpen(true);
  };

  const upload = async (type: DocType, file: File) => {
    setUploading(type);
    const collection = type === "licence" ? "licence" : "certificat_medical";
    try {
      // PDF → /uploads/document ; image → /uploads/image (comme le mobile)
      const url =
        file.type === "application/pdf"
          ? await uploadsApi.document(file, { model: "athlete", model_id: id, collection })
          : await uploadsApi.image(file, { model: "athlete", model_id: id, collection });
      await updateDocs.mutateAsync(type === "licence" ? { licence_url: url } : { certificat_medical_url: url });
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setUploading(null);
    }
  };

  const onRemove = async () => {
    if (
      await confirm({
        title: "Retirer du club",
        message: `${name} ne fera plus partie du club et perdra l'accès à ses cours. Continuer ?`,
        confirmLabel: "Retirer",
        danger: true,
      })
    ) {
      remove.mutate(id, { onSuccess: () => router.push("/maitre/athletes") });
    }
  };

  const onResetPassword = async () => {
    if (
      await confirm({
        title: "Réinitialiser le mot de passe",
        message: `Un nouveau mot de passe provisoire sera généré pour ${name}. L'ancien ne fonctionnera plus et ses sessions ouvertes seront fermées. Continuer ?`,
        confirmLabel: "Réinitialiser",
      })
    ) {
      resetPassword.mutate(id, { onSuccess: setNewCreds });
    }
  };

  const copyCreds = async () => {
    if (!newCreds) return;
    try {
      await navigator.clipboard.writeText(
        `Bonjour ${athlete.user?.prenom ?? ""}, votre mot de passe LCC Taekwondo a été réinitialisé.\n` +
          `Identifiant : ${newCreds.identifiant}\nMot de passe provisoire : ${newCreds.mot_de_passe_provisoire}`,
      );
      toast.success("Identifiants copiés");
    } catch {
      toast.error("Copie impossible, notez les identifiants à la main");
    }
  };

  const expired = athlete.licence_expiration && new Date(athlete.licence_expiration) < new Date();

  return (
    <>
      <PageHeader title="Profil athlète" subtitle={name} backHref="/maitre/athletes" size="lg" />
      <PageContainer size="lg" className="mt-4 grid grid-cols-1 gap-6 md:mt-0 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="flex flex-col items-center p-6 text-center">
            <Avatar src={athlete.user?.photo_url ?? athlete.photo_url} name={name} size={88} />
            <p className="mt-3 text-xl font-extrabold text-white">{name}</p>
            <p className="text-sm break-all text-muted">{athlete.user?.email ?? athlete.user?.identifiant ?? athlete.email}</p>
            {athlete.user?.telephone && <p className="text-sm text-muted">{athlete.user.telephone}</p>}
            <GradeChip grade={athlete.grade} dan={athlete.dan} className="mt-3" />
            <div className="mt-4 w-full border-t border-line pt-3">
              <GradeProgress current={athlete.grade} />
            </div>
          </Card>
          <Button variant="secondary" fullWidth icon={<Award className="size-4" />} onClick={() => setGradeOpen(true)}>
            Mettre à jour le grade
          </Button>
          {athlete.statut_club === "valide" && (
            <Button variant="outline" fullWidth icon={<KeyRound className="size-4" />} loading={resetPassword.isPending} onClick={onResetPassword}>
              Réinitialiser le mot de passe
            </Button>
          )}
          {athlete.statut_club === "valide" && (
            <Button variant="danger" fullWidth icon={<UserMinus className="size-4" />} loading={remove.isPending} onClick={onRemove}>
              Retirer du club
            </Button>
          )}
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Card>
              <h2 className="mb-1 text-[15px] font-bold text-white">Informations personnelles</h2>
              <InfoRow label="Date de naissance" value={athlete.date_naissance ? formatDate(athlete.date_naissance) : "—"} />
              <InfoRow label="Sexe" value={athlete.sexe === "M" ? "Masculin" : athlete.sexe === "F" ? "Féminin" : "—"} />
              <InfoRow label="Catégorie de poids" value={athlete.categorie_poids ?? "—"} />
            </Card>
            <Card>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-[15px] font-bold text-white">Licence</h2>
                <button type="button" onClick={openLicence} className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
                  <Pencil className="size-3.5" /> Modifier
                </button>
              </div>
              <InfoRow label="Numéro de licence" value={athlete.numero_licence ?? <span className="font-normal text-muted">Non renseigné</span>} />
              <InfoRow
                label="Expiration"
                value={
                  athlete.licence_expiration ? (
                    <span className={cn(expired && "text-[#f87171]")}>
                      {formatDate(athlete.licence_expiration)}
                      {expired && " · expirée"}
                    </span>
                  ) : (
                    <span className="font-normal text-muted">Non renseignée</span>
                  )
                }
              />
            </Card>
          </div>

          <Card>
            <h2 className="mb-3 text-[15px] font-bold text-white">Documents</h2>
            <div className="divide-y divide-line">
              <DocRow label="Licence sportive" url={storageUrl(athlete.licence_url)} uploading={uploading === "licence"} onPick={(f) => upload("licence", f)} />
              <DocRow label="Certificat médical" url={storageUrl(athlete.certificat_medical_url)} uploading={uploading === "certificat"} onPick={(f) => upload("certificat", f)} />
            </div>
          </Card>
        </div>
      </PageContainer>

      {/* Nouveau mot de passe provisoire */}
      <Dialog
        open={!!newCreds}
        onClose={() => setNewCreds(null)}
        title="Nouveau mot de passe"
        size="sm"
        footer={
          <>
            <Button variant="subtle" fullWidth onClick={() => setNewCreds(null)}>
              Fermer
            </Button>
            <Button variant="secondary" fullWidth icon={<Copy className="size-4" />} onClick={copyCreds}>
              Copier
            </Button>
          </>
        }
      >
        <p className="mb-4 text-sm text-muted">
          {newCreds?.email_envoye
            ? `Envoyé à ${newCreds.user.email}. Notez-le aussi au cas où.`
            : "Transmettez ces identifiants à l'athlète : ils ne seront plus affichés ensuite."}
        </p>
        <dl className="rounded-lg border border-line bg-ink/40 p-4">
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Identifiant</dt>
          <dd className="mb-3 font-mono text-lg font-bold break-all text-white select-all">{newCreds?.identifiant}</dd>
          <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Mot de passe provisoire</dt>
          <dd className="font-mono text-lg font-bold text-white select-all">{newCreds?.mot_de_passe_provisoire}</dd>
        </dl>
      </Dialog>

      {/* Choix du grade */}
      <Dialog open={gradeOpen} onClose={fermerGrade} title={choixDan ? "Ceinture noire : choisir le dan" : "Choisir un grade"} size="sm">
        {choixDan ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {DANS.map((d) => {
                const current = athlete.grade === "noir" && athlete.dan === d;
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={updateGrade.isPending}
                    onClick={() => updateGrade.mutate({ id, grade: "noir", dan: d }, { onSuccess: fermerGrade })}
                    className={cn(
                      "flex h-11 items-center justify-center rounded-md border-[1.5px] text-sm font-semibold transition-colors",
                      current ? "border-white bg-white/10 text-white" : "border-line text-muted hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {updateGrade.isPending && updateGrade.variables?.dan === d ? <Spinner className="size-4" /> : danLabel(d)}
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => setChoixDan(false)} className="w-full text-center text-sm text-muted hover:text-white">
              Retour
            </button>
          </div>
        ) : (
        <ul className="space-y-2" role="listbox" aria-label="Grades">
          {GRADES.map((g: Grade) => {
            const c = GRADE_COLORS[g];
            const current = athlete.grade === g;
            return (
              <li key={g}>
                <button
                  type="button"
                  role="option"
                  aria-selected={current}
                  disabled={updateGrade.isPending}
                  onClick={() => (g === "noir" ? setChoixDan(true) : updateGrade.mutate({ id, grade: g }, { onSuccess: fermerGrade }))}
                  className={cn("flex w-full items-center gap-3 rounded-md border-[1.5px] px-4 py-3 text-left transition-colors hover:bg-white/5", current && "bg-white/5")}
                  style={{ borderColor: gradeAccent(g) }}
                >
                  <span className="size-5 rounded-full" style={{ backgroundColor: c.bg, border: c.border ? `1px solid #8E8E93` : undefined }} />
                  <span className="flex-1 font-semibold" style={{ color: gradeAccent(g) }}>
                    {GRADE_LABELS[g]}
                  </span>
                  {updateGrade.isPending && updateGrade.variables?.grade === g ? <Spinner className="size-4" /> : current && <Check className="size-[18px]" style={{ color: gradeAccent(g) }} />}
                </button>
              </li>
            );
          })}
        </ul>
        )}
      </Dialog>

      {/* Informations de licence */}
      <Dialog
        open={licenceOpen}
        onClose={() => setLicenceOpen(false)}
        title="Informations de licence"
        size="sm"
        footer={
          <>
            <Button variant="subtle" fullWidth onClick={() => setLicenceOpen(false)}>
              Annuler
            </Button>
            <Button
              fullWidth
              loading={updateLicence.isPending}
              onClick={() =>
                updateLicence.mutate(
                  { numero_licence: numLicence.trim() || undefined, licence_expiration: expiration || undefined },
                  { onSuccess: () => setLicenceOpen(false) },
                )
              }
            >
              Enregistrer
            </Button>
          </>
        }
      >
        <Input label="Numéro de licence" value={numLicence} onChange={(e) => setNumLicence(e.target.value.toUpperCase())} placeholder="Ex : LCC-2024-001" data-autofocus />
        <Input label="Date d'expiration" type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)} containerClassName="mb-0" />
      </Dialog>
    </>
  );
}

function DocRow({ label, url, uploading, onPick }: { label: string; url?: string; uploading: boolean; onPick: (f: File) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-primary/12 text-primary">
        <FileText className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className={cn("text-xs", url ? "text-secondary-light" : "text-muted")}>{url ? "Document disponible" : "Aucun document"}</p>
      </div>
      <div className="flex gap-2">
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-surface-3 px-3 text-[13px] font-semibold text-white hover:bg-[#363638]">
            <ExternalLink className="size-3.5" /> Voir
          </a>
        )}
        <FilePick
          accept="application/pdf,image/jpeg,image/png"
          onFiles={(f) => onPick(f[0])}
          disabled={uploading}
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-primary px-3 text-[13px] font-semibold text-white hover:bg-[#d65c08] disabled:opacity-60"
        >
          {uploading ? <Spinner className="size-4" /> : url ? <RefreshCw className="size-3.5" /> : <Upload className="size-3.5" />}
          {url ? "Remplacer" : "Ajouter"}
        </FilePick>
      </div>
    </div>
  );
}
