"use client";

import { useState } from "react";
import { Mail, MoreHorizontal, Plus, RefreshCw, Send, Trash2 } from "lucide-react";
import { useDeleteInvitation, useInvitations, useResendInvitation, useSendInvitation } from "@/lib/hooks/misc";
import { COLORS } from "@/lib/config";
import { formatShortDate } from "@/lib/format";
import type { Invitation } from "@/lib/types";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Badge, EmptyState, ErrorState, SkeletonList } from "@/components/ui/display";
import { Button } from "@/components/ui/button";
import { Dialog, useConfirm } from "@/components/ui/dialog";
import { Input } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";

const STATUS = {
  en_attente: { label: "En attente", color: COLORS.primary },
  acceptee: { label: "Acceptée", color: COLORS.secondary },
  expiree: { label: "Expirée", color: COLORS.muted },
};
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// La tâche d'expiration ne tourne pas forcément côté serveur : on se fie aussi à expire_le
function displayStatus(i: Invitation): Invitation["statut"] {
  if (i.statut === "en_attente" && new Date(i.expire_le) < new Date()) return "expiree";
  return i.statut;
}

export default function InvitationsPage() {
  const { data, isLoading, isError, refetch } = useInvitations();
  const send = useSendInvitation();
  const resend = useResendInvitation();
  const del = useDeleteInvitation();
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [actionsFor, setActionsFor] = useState<Invitation | null>(null);

  const list = data ?? [];

  const close = () => {
    setOpen(false);
    setEmail("");
    setError(undefined);
  };

  const submit = () => {
    const v = email.trim();
    if (!EMAIL_RE.test(v)) return setError("Email invalide");
    send.mutate(v, { onSuccess: (res) => res.erreurs.length === 0 && close() });
  };

  const onDelete = async (i: Invitation) => {
    setActionsFor(null);
    if (await confirm({ title: "Supprimer l'invitation", message: `Supprimer l'invitation envoyée à ${i.email_invite} ?`, confirmLabel: "Supprimer", danger: true })) {
      del.mutate(i.id);
    }
  };

  return (
    <>
      <PageHeader
        title="Invitations"
        subtitle="Invitez des athlètes à rejoindre votre club"
        backHref="/maitre/athletes"
        size="lg"
        actions={
          <Button variant="secondary" size="sm" icon={<Plus className="size-4" />} onClick={() => setOpen(true)}>
            Inviter
          </Button>
        }
      />
      <PageContainer size="lg" className="mt-4 md:mt-0">
        {isLoading ? (
          <SkeletonList count={3} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : list.length === 0 ? (
          <EmptyState
            icon={Mail}
            message="Aucune invitation envoyée"
            description="L'athlète invité rejoint automatiquement votre club à son inscription."
            action={<Button variant="outline-secondary" size="sm" onClick={() => setOpen(true)}>Inviter quelqu&apos;un</Button>}
          />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-lg bg-surface">
            {list.map((i) => {
              const st = STATUS[displayStatus(i)] ?? STATUS.en_attente;
              const busy = (resend.isPending && resend.variables === i.id) || (del.isPending && del.variables === i.id);
              return (
                <li key={i.id} className="flex items-center gap-3 px-4 py-3.5">
                  <span className="hidden size-10 shrink-0 place-items-center rounded-full bg-surface-3 text-muted sm:grid">
                    <Mail className="size-[18px]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold text-white">{i.email_invite}</p>
                    <p className="text-xs text-muted">
                      Envoyée le {formatShortDate(i.created_at)}
                      {i.statut === "en_attente" && ` · expire le ${formatShortDate(i.expire_le)}`}
                    </p>
                  </div>
                  <Badge label={st.label} color={st.color} size="sm" />
                  {i.statut !== "acceptee" && (
                    <>
                      {/* Desktop : actions directes ; smartphone : feuille d'actions */}
                      <div className="hidden gap-1 md:flex">
                        <button type="button" onClick={() => resend.mutate(i.id)} disabled={busy} className="grid size-9 place-items-center rounded-full text-muted hover:bg-white/5 hover:text-white" aria-label={`Renvoyer à ${i.email_invite}`} title="Renvoyer">
                          {resend.isPending && resend.variables === i.id ? <Spinner className="size-4" /> : <RefreshCw className="size-4" />}
                        </button>
                        <button type="button" onClick={() => onDelete(i)} disabled={busy} className="grid size-9 place-items-center rounded-full text-[#f87171] hover:bg-danger/10" aria-label={`Supprimer l'invitation de ${i.email_invite}`} title="Supprimer">
                          {del.isPending && del.variables === i.id ? <Spinner className="size-4" /> : <Trash2 className="size-4" />}
                        </button>
                      </div>
                      <button type="button" onClick={() => setActionsFor(i)} disabled={busy} className="grid size-9 place-items-center rounded-full text-muted hover:bg-white/5 md:hidden" aria-label={`Actions pour ${i.email_invite}`}>
                        {busy ? <Spinner className="size-4" /> : <MoreHorizontal className="size-5" />}
                      </button>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PageContainer>

      <Dialog
        open={open}
        onClose={close}
        title="Inviter par email"
        description="Un email avec un lien d'inscription sera envoyé."
        size="sm"
        footer={
          <>
            <Button variant="subtle" fullWidth onClick={close}>
              Annuler
            </Button>
            <Button variant="secondary" fullWidth loading={send.isPending} icon={<Send className="size-4" />} onClick={submit}>
              Envoyer
            </Button>
          </>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <Input
            label="Email"
            type="email"
            autoComplete="off"
            placeholder="athlete@email.com"
            leftIcon={<Mail />}
            value={email}
            error={error}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(undefined);
            }}
            containerClassName="mb-0"
            data-autofocus
          />
        </form>
      </Dialog>

      <Dialog open={!!actionsFor} onClose={() => setActionsFor(null)} title={actionsFor?.email_invite} description="Que voulez-vous faire ?" size="sm">
        {actionsFor && (
          <div className="space-y-2">
            <Button variant="subtle" fullWidth icon={<RefreshCw className="size-4" />} onClick={() => { resend.mutate(actionsFor.id); setActionsFor(null); }}>
              Renvoyer
            </Button>
            <Button variant="danger" fullWidth icon={<Trash2 className="size-4" />} onClick={() => onDelete(actionsFor)}>
              Supprimer
            </Button>
          </div>
        )}
      </Dialog>
    </>
  );
}
