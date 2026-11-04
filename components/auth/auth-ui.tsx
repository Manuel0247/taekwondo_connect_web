"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ExternalLink, ShieldAlert } from "lucide-react";
import { cn, LARAVEL_URL, WEBADMIN_URL } from "@/lib/utils";
import { Dialog } from "../ui/dialog";
import { Button, LinkButton } from "../ui/button";
import { Spinner } from "../ui/spinner";

/** Conteneur d'un écran d'authentification (logo mobile en haut, carte centrée) */
export function AuthScreen({
  children,
  title,
  subtitle,
  backHref,
  showLogo = false,
  footer,
  width = "md",
}: {
  children: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  backHref?: string;
  showLogo?: boolean;
  footer?: ReactNode;
  width?: "md" | "lg";
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 lg:py-12">
      <div className={cn("w-full animate-slide-up", width === "md" ? "max-w-[440px]" : "max-w-[560px]")}>
        {showLogo && (
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Image src="/images/logo.png" alt="" width={96} height={96} className="rounded-md" priority />
            <p className="mt-3 text-[26px] font-extrabold text-white">LCC Taekwondo</p>
            <p className="text-[13px] text-muted">Ligue Communale de Cocody</p>
          </div>
        )}
        <div className="rounded-xl bg-surface p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)] sm:p-8 lg:border lg:border-line">
          <div className="mb-6 flex items-start gap-3">
            {backHref && (
              <Link
                href={backHref}
                className="-ml-2 grid size-10 shrink-0 place-items-center rounded-full text-white hover:bg-white/5"
                aria-label="Retour"
              >
                <ArrowLeft className="size-[22px]" />
              </Link>
            )}
            <div className="min-w-0">
              <h1 className="text-[22px] leading-tight font-extrabold text-white">{title}</h1>
              {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>}
            </div>
          </div>
          {children}
        </div>
        {footer && <div className="mt-8 text-center">{footer}</div>}
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.7 2.3 12 2.3 6.6 2.3 2.3 6.6 2.3 12s4.3 9.7 9.7 9.7c5.6 0 9.3-3.9 9.3-9.5 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  );
}

/**
 * Connexion Google (seul fournisseur actif côté API). Le navigateur part sur la route
 * Laravel /auth/social/google ; l'API redirige vers /auth/callback avec le jeton.
 */
export function SocialAuthButtons() {
  const [loading, setLoading] = useState(false);
  const start = () => {
    setLoading(true);
    // Route OAuth du backend Laravel (domaine externe à l'application)
    const target = new URL("/auth/social/google", LARAVEL_URL);
    target.searchParams.set("return_url", `${window.location.origin}/auth/callback`);
    window.location.assign(target.toString());
  };
  return (
    <div className="mt-6">
      <div className="mb-4 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        ou continuer avec
        <span className="h-px flex-1 bg-line" />
      </div>
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="flex h-12 w-full items-center gap-3 rounded-md border border-line bg-ink/40 px-3 text-sm font-semibold text-white transition-colors hover:bg-white/5 disabled:opacity-60"
      >
        <span className="grid size-8 place-items-center rounded-sm bg-white">{loading ? <Spinner className="size-4 text-ink" /> : <GoogleLogo />}</span>
        <span className="flex-1 text-left">Continuer avec Google</span>
      </button>
    </div>
  );
}

/** Compte administrateur : l'administration se fait depuis le webadmin */
export function AdminRedirectDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Compte administrateur"
      size="sm"
      footer={
        <>
          <Button variant="subtle" fullWidth onClick={onClose}>
            Fermer
          </Button>
          <LinkButton href={WEBADMIN_URL} fullWidth icon={<ExternalLink className="size-4" />}>
            Ouvrir le webadmin
          </LinkButton>
        </>
      }
    >
      <div className="flex gap-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-primary" />
        <p className="text-sm leading-relaxed text-muted">
          L&apos;administration de la ligue se fait depuis le webadmin, pas depuis l&apos;espace athlètes et clubs.
        </p>
      </div>
    </Dialog>
  );
}
