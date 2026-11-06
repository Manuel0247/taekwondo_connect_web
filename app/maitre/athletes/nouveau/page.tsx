"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Mail, Phone, Share2, User } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useCreateClubAthlete } from "@/lib/hooks/athletes";
import { DANS, GRADES, GRADE_COLORS, GRADE_SHORT, POIDS, danLabel } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { CreatedAccount, Grade } from "@/lib/types";
import { PageContainer, PageHeader } from "@/components/layout/page";
import { Card } from "@/components/ui/display";
import { Button, LinkButton } from "@/components/ui/button";
import { Chip } from "@/components/ui/controls";
import { FieldLabel, Input } from "@/components/ui/field";

const schema = z.object({
  prenom: z.string().trim().min(1, "Prénom requis").max(100),
  nom: z.string().trim().min(1, "Nom requis").max(100),
  // Facultatif : sans email, l'athlète se connecte avec l'identifiant généré
  email: z.string().trim().email("Email invalide").or(z.literal("")),
  telephone: z.string().trim().max(30),
});

type Form = z.infer<typeof schema>;
const EMPTY: Form = { prenom: "", nom: "", email: "", telephone: "" };

export default function AddAthletePage() {
  const create = useCreateClubAthlete();
  const [sexe, setSexe] = useState<"M" | "F">();
  const [grade, setGrade] = useState<Grade>("blanc");
  const [dan, setDan] = useState(1);
  const [poids, setPoids] = useState<string>();
  const [created, setCreated] = useState<CreatedAccount | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
  });

  const onSubmit = (d: Form) =>
    create.mutate(
      {
        prenom: d.prenom,
        nom: d.nom,
        email: d.email || undefined,
        telephone: d.telephone || undefined,
        sexe,
        grade,
        dan: grade === "noir" ? dan : undefined,
        categorie_poids: poids,
      },
      { onSuccess: setCreated },
    );

  const addAnother = () => {
    reset(EMPTY);
    setSexe(undefined);
    setGrade("blanc");
    setPoids(undefined);
    setCreated(null);
  };

  return (
    <>
      <PageHeader title={created ? "Athlète ajouté" : "Ajouter un athlète"} backHref="/maitre/athletes" size="md" />
      <PageContainer size="md" className="mt-4 md:mt-0">
        {created ? (
          <Credentials account={created} onAddAnother={addAnother} />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Card className="p-5 sm:p-6">
              <p className="mb-5 text-sm text-muted">
                Le compte est créé et validé dans votre club. Un identifiant et un mot de passe provisoire sont générés ;
                l&apos;email est facultatif.
              </p>
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                <Input label="Prénom" placeholder="Jean" leftIcon={<User />} error={errors.prenom?.message} {...register("prenom")} />
                <Input label="Nom" placeholder="Konan" leftIcon={<User />} error={errors.nom?.message} {...register("nom")} />
                <Input
                  label="Email (facultatif)"
                  type="email"
                  inputMode="email"
                  placeholder="exemple@email.com"
                  leftIcon={<Mail />}
                  error={errors.email?.message}
                  {...register("email")}
                />
                <Input label="Téléphone (facultatif)" type="tel" placeholder="07 00 00 00 00" leftIcon={<Phone />} {...register("telephone")} />
              </div>

              <FieldLabel>Sexe</FieldLabel>
              <div className="mb-5 flex flex-wrap gap-2">
                {(["M", "F"] as const).map((s) => (
                  <Chip key={s} color="secondary" active={sexe === s} onClick={() => setSexe(sexe === s ? undefined : s)}>
                    {s === "M" ? "Masculin" : "Féminin"}
                  </Chip>
                ))}
              </div>

              <FieldLabel>Grade</FieldLabel>
              <div className="mb-5 flex flex-wrap gap-2">
                {GRADES.map((g) => {
                  const c = GRADE_COLORS[g];
                  const on = grade === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setGrade(g)}
                      className={cn(
                        "h-9 rounded-full border px-4 text-[13px] font-semibold transition-colors",
                        !on && "border-line bg-surface text-muted hover:text-white",
                      )}
                      style={on ? { background: c.bg, color: c.text, borderColor: c.border ?? c.bg } : undefined}
                    >
                      {GRADE_SHORT[g]}
                    </button>
                  );
                })}
              </div>

              {grade === "noir" && (
                <>
                  <FieldLabel>Dan</FieldLabel>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {DANS.map((d) => (
                      <Chip key={d} color="secondary" active={dan === d} onClick={() => setDan(d)}>
                        {danLabel(d)}
                      </Chip>
                    ))}
                  </div>
                </>
              )}

              <FieldLabel>Catégorie de poids (facultatif)</FieldLabel>
              <div className="mb-6 flex flex-wrap gap-2">
                {POIDS.map((p) => (
                  <Chip key={p} color="secondary" active={poids === p} onClick={() => setPoids(poids === p ? undefined : p)}>
                    {p}
                  </Chip>
                ))}
              </div>

              <Button type="submit" variant="secondary" fullWidth loading={create.isPending}>
                Créer le compte
              </Button>
            </Card>
          </form>
        )}
      </PageContainer>
    </>
  );
}

function Credentials({ account, onAddAnother }: { account: CreatedAccount; onAddAnother: () => void }) {
  const { user, identifiant, mot_de_passe_provisoire, email_envoye } = account;
  const [copied, setCopied] = useState(false);
  const message =
    `Bonjour ${user.prenom}, votre compte LCC Taekwondo a été créé.\n` +
    `Identifiant : ${identifiant}\nMot de passe provisoire : ${mot_de_passe_provisoire}\n` +
    `Connectez-vous sur l'application ou le site LCC Taekwondo.`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast.success("Identifiants copiés");
    } catch {
      toast.error("Copie impossible, notez les identifiants à la main");
    }
  };
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <Card className="p-5 text-center sm:p-8">
      <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-secondary">
        <Check className="size-8 text-white" />
      </div>
      <h2 className="text-lg font-extrabold text-white">
        {user.prenom} {user.nom} fait partie du club
      </h2>
      <p className="mx-auto mt-2 mb-6 max-w-sm text-sm text-muted">
        {email_envoye
          ? `Ses identifiants ont été envoyés à ${user.email}. Notez-les aussi au cas où.`
          : "Transmettez-lui ces identifiants : ils ne seront plus affichés ensuite."}
      </p>

      <dl className="mb-6 rounded-lg border border-line bg-ink/40 p-5 text-left">
        <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Identifiant</dt>
        <dd className="mb-4 font-mono text-xl font-bold break-all text-white select-all">{identifiant}</dd>
        <dt className="text-xs font-semibold tracking-wide text-muted uppercase">Mot de passe provisoire</dt>
        <dd className="font-mono text-xl font-bold text-white select-all">{mot_de_passe_provisoire}</dd>
      </dl>

      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="secondary" icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />} onClick={copy}>
            {copied ? "Copié" : "Copier"}
          </Button>
          {canShare ? (
            <Button variant="outline-secondary" icon={<Share2 className="size-4" />} onClick={() => navigator.share({ text: message }).catch(() => {})}>
              Partager
            </Button>
          ) : (
            <Button variant="outline-secondary" onClick={onAddAnother}>
              Ajouter un autre
            </Button>
          )}
        </div>
        {canShare && (
          <Button variant="ghost" onClick={onAddAnother}>
            Ajouter un autre athlète
          </Button>
        )}
        <LinkButton href="/maitre/athletes" variant="ghost">
          Terminé
        </LinkButton>
      </div>
    </Card>
  );
}
