"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BellOff, Lock, Phone, User } from "lucide-react";
import { z } from "zod";
import {
  NOTIF_PREFS, useChangePassword, useMarkNotificationRead, useNotifications, useSaveNotificationPreferences,
  useUpdateAccount, useUserMe,
} from "@/lib/hooks/misc";
import { changePasswordSchema } from "@/lib/validation";
import { DANS, GRADES, GRADE_COLORS, GRADE_SHORT, PASSWORD_HINT, danLabel } from "@/lib/config";
import { useAuthStore } from "@/lib/stores";
import { cn } from "@/lib/utils";
import type { Grade, NotificationPreferences } from "@/lib/types";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Card, EmptyState, ErrorState, SkeletonList } from "@/components/ui/display";
import { Chip, Switch } from "@/components/ui/controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { NotificationItem } from "@/components/domain/cards";

// ── Liste des notifications ─────────────────────────────────────────────────

export function NotificationsScreen({ backHref }: { backHref: string }) {
  const { data, isLoading, isError, refetch } = useNotifications();
  const markRead = useMarkNotificationRead();
  const list = data ?? [];
  const unread = list.filter((n) => !n.est_lue).length;

  return (
    <>
      <PageHeader title="Notifications" subtitle={unread > 0 ? `${unread} non lue${unread > 1 ? "s" : ""}` : "Tout est lu"} backHref={backHref} size="md" />
      <PageContainer size="md" className="mt-4 md:mt-0">
        {isLoading ? (
          <SkeletonList count={4} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : list.length === 0 ? (
          <EmptyState icon={BellOff} message="Aucune notification" description="Vous serez prévenu ici des nouveaux cours, validations et événements." />
        ) : (
          <ul className="space-y-2">
            {list.map((n) => (
              <li key={n.id}>
                <NotificationItem
                  notification={n}
                  busy={markRead.isPending && markRead.variables === n.id}
                  onOpen={() => !n.est_lue && markRead.mutate(n.id)}
                />
              </li>
            ))}
          </ul>
        )}
      </PageContainer>
    </>
  );
}

// ── Préférences de notifications ────────────────────────────────────────────

export function NotificationPrefsScreen({ backHref, accent = "primary" }: { backHref: string; accent?: "primary" | "secondary" }) {
  const { data, isLoading, isError, refetch } = useUserMe();

  return (
    <>
      <PageHeader title="Préférences de notifications" subtitle="Choisissez ce que vous souhaitez recevoir" backHref={backHref} size="md" />
      <PageContainer size="md" className="mt-4 md:mt-0">
        {isLoading ? (
          <SkeletonList count={3} />
        ) : isError || !data ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <PrefsForm saved={data.notification_preference as Record<string, unknown> | null | undefined} accent={accent} />
        )}
      </PageContainer>
    </>
  );
}

function PrefsForm({ saved, accent }: { saved: Record<string, unknown> | null | undefined; accent: "primary" | "secondary" }) {
  const save = useSaveNotificationPreferences();
  // Valeurs enregistrées (activées par défaut si aucune)
  const [prefs, setPrefs] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(NOTIF_PREFS.map((p) => [p.key, saved ? saved[p.key] !== false : true])),
  );

  return (
          <>
            <Card className="divide-y divide-line p-0">
              {NOTIF_PREFS.map((p) => (
                <label key={p.key} className="flex cursor-pointer items-center gap-4 px-4 py-3.5">
                  <span className="flex-1">
                    <span className="block text-[15px] font-medium text-white">{p.label}</span>
                    <span className="block text-xs text-muted">{p.hint}</span>
                  </span>
                  <Switch
                    label={p.label}
                    color={accent}
                    checked={prefs[p.key]}
                    disabled={save.isPending}
                    onChange={(v) => setPrefs((prev) => ({ ...prev, [p.key]: v }))}
                  />
                </label>
              ))}
            </Card>
            <Button
              size="lg"
              variant={accent === "secondary" ? "secondary" : "primary"}
              className="mt-6 w-full sm:w-auto"
              loading={save.isPending}
              onClick={() => save.mutate(prefs as unknown as Partial<NotificationPreferences>)}
            >
              Enregistrer
            </Button>
          </>
  );
}

// ── Compte : identité et mot de passe (API /users/me) ───────────────────────

const identitySchema = z.object({
  prenom: z.string().trim().min(2, "Prénom requis").max(100),
  nom: z.string().trim().min(2, "Nom requis").max(100),
  telephone: z.string().trim().max(30).optional(),
});

/** Ceinture du maître de salle, affichée aux athlètes sur la page du club */
function BeltCard({ variant }: { variant: "primary" | "secondary" }) {
  const user = useAuthStore((s) => s.user);
  const update = useUpdateAccount();
  const [grade, setGrade] = useState<Grade | null>(user?.grade ?? null);
  const [dan, setDan] = useState(user?.dan ?? 1);

  return (
    <Card className="p-5 sm:p-6 lg:col-span-2">
      <h2 className="mb-1 text-lg font-bold text-white">Ma ceinture</h2>
      <p className="mb-5 text-sm text-muted">Affichée aux athlètes sur la page de votre club.</p>
      <div className="mb-5 flex flex-wrap gap-2">
        {GRADES.map((g) => {
          const c = GRADE_COLORS[g];
          const on = grade === g;
          return (
            <button
              key={g}
              type="button"
              aria-pressed={on}
              onClick={() => setGrade(on ? null : g)}
              className={cn("h-9 rounded-full border px-4 text-[13px] font-semibold transition-colors", !on && "border-line bg-surface text-muted hover:text-white")}
              style={on ? { background: c.bg, color: c.text, borderColor: c.border ?? c.bg } : undefined}
            >
              {GRADE_SHORT[g]}
            </button>
          );
        })}
      </div>
      {grade === "noir" && (
        <div className="mb-5 flex flex-wrap gap-2">
          {DANS.map((d) => (
            <Chip key={d} color="secondary" active={dan === d} onClick={() => setDan(d)}>
              {danLabel(d)}
            </Chip>
          ))}
        </div>
      )}
      <Button variant={variant} loading={update.isPending} onClick={() => update.mutate({ grade, dan: grade === "noir" ? dan : null })}>
        Enregistrer ma ceinture
      </Button>
    </Card>
  );
}

export function AccountScreen({ backHref, accent = "primary", showBelt = false }: { backHref: string; accent?: "primary" | "secondary"; showBelt?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const me = useUserMe();
  const update = useUpdateAccount();
  const changePwd = useChangePassword();
  const variant = accent === "secondary" ? "secondary" : "primary";

  const idForm = useForm<z.infer<typeof identitySchema>>({
    resolver: zodResolver(identitySchema),
    values: { prenom: me.data?.prenom ?? user?.prenom ?? "", nom: me.data?.nom ?? user?.nom ?? "", telephone: me.data?.telephone ?? "" },
  });
  const pwdForm = useForm<z.infer<typeof changePasswordSchema>>({ resolver: zodResolver(changePasswordSchema) });

  return (
    <>
      <PageHeader title="Mon compte" subtitle={user?.email ?? user?.identifiant ?? undefined} backHref={backHref} size="lg" />
      <PageContainer size="lg" className="mt-4 grid grid-cols-1 gap-6 md:mt-0 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <h2 className="mb-1 text-lg font-bold text-white">Informations personnelles</h2>
          <p className="mb-5 text-sm text-muted">Nom affiché dans la ligue et numéro de contact.</p>
          <form
            noValidate
            onSubmit={idForm.handleSubmit((d) => update.mutate({ prenom: d.prenom, nom: d.nom, telephone: d.telephone || null }))}
          >
            <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
              <Input label="Prénom" autoComplete="given-name" leftIcon={<User />} error={idForm.formState.errors.prenom?.message} {...idForm.register("prenom")} />
              <Input label="Nom" autoComplete="family-name" leftIcon={<User />} error={idForm.formState.errors.nom?.message} {...idForm.register("nom")} />
            </div>
            <Input label="Téléphone" type="tel" autoComplete="tel" placeholder="+225 07 XX XX XX XX" leftIcon={<Phone />} {...idForm.register("telephone")} />
            <Button type="submit" variant={variant} loading={update.isPending}>
              Enregistrer
            </Button>
          </form>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="mb-1 text-lg font-bold text-white">Mot de passe</h2>
          <p className="mb-5 text-sm text-muted">{PASSWORD_HINT}.</p>
          <form
            noValidate
            onSubmit={pwdForm.handleSubmit((d) => changePwd.mutate(d, { onSuccess: () => pwdForm.reset() }))}
          >
            <Input label="Mot de passe actuel" secure autoComplete="current-password" leftIcon={<Lock />} error={pwdForm.formState.errors.ancien_mot_de_passe?.message} {...pwdForm.register("ancien_mot_de_passe")} />
            <Input label="Nouveau mot de passe" secure autoComplete="new-password" leftIcon={<Lock />} error={pwdForm.formState.errors.mot_de_passe?.message} {...pwdForm.register("mot_de_passe")} />
            <Input label="Confirmer" secure autoComplete="new-password" leftIcon={<Lock />} error={pwdForm.formState.errors.mot_de_passe_confirmation?.message} {...pwdForm.register("mot_de_passe_confirmation")} />
            <Button type="submit" variant={variant} loading={changePwd.isPending}>
              Modifier le mot de passe
            </Button>
          </form>
        </Card>

        {showBelt && <BeltCard variant={variant} />}
      </PageContainer>
    </>
  );
}
