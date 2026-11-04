"use client";

import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { useSearchParams } from "next/navigation";
import { MailOpen } from "lucide-react";
import { useResendOtp, useVerifyOtp } from "@/lib/hooks/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AdminRedirectDialog, AuthScreen } from "@/components/auth/auth-ui";

const LEN = 6;
const RESEND_DELAY = 60;

export function OtpForm() {
  const email = useSearchParams().get("email") ?? "";
  const [adminOpen, setAdminOpen] = useState(false);
  const verify = useVerifyOtp(() => setAdminOpen(true));
  const resend = useResendOtp();
  const [digits, setDigits] = useState<string[]>(Array(LEN).fill(""));
  const [countdown, setCountdown] = useState(RESEND_DELAY);
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const masked = email.replace(/(.{2})(.*)(@.*)/, (_, a: string, b: string, c: string) => a + "*".repeat(Math.max(2, b.length)) + c);
  const complete = digits.every((d) => d !== "");

  const submit = (ds = digits) => {
    const code = ds.join("");
    if (code.length === LEN && email) verify.mutate({ email, code });
  };

  const setAt = (i: number, value: string) => {
    const d = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = d;
    setDigits(next);
    if (verify.isError) verify.reset();
    if (d && i < LEN - 1) refs.current[i + 1]?.focus();
    if (d && next.every(Boolean)) submit(next);
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      const next = [...digits];
      next[i - 1] = "";
      setDigits(next);
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < LEN - 1) refs.current[i + 1]?.focus();
  };

  // Coller un code complet depuis le presse-papiers
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, LEN);
    if (!text) return;
    e.preventDefault();
    const next = Array.from({ length: LEN }, (_, i) => text[i] ?? "");
    setDigits(next);
    refs.current[Math.min(text.length, LEN - 1)]?.focus();
    if (text.length === LEN) submit(next);
  };

  const onResend = () => {
    if (countdown > 0 || !email) return;
    resend.mutate(email);
    setCountdown(RESEND_DELAY);
    setDigits(Array(LEN).fill(""));
    refs.current[0]?.focus();
  };

  return (
    <AuthScreen title="Vérifiez votre email" backHref="/connexion">
      <div className="-mt-2 flex flex-col items-center text-center">
        <span className="mb-4 grid size-20 place-items-center rounded-full bg-primary/12 text-primary">
          <MailOpen className="size-10" strokeWidth={1.6} />
        </span>
        <p className="text-sm leading-relaxed text-muted">
          Un code à 6 chiffres a été envoyé à
          <br />
          <span className="font-bold text-white">{masked || "votre adresse email"}</span>
        </p>

        <fieldset className="mt-7 flex justify-center gap-2 sm:gap-3">
          <legend className="sr-only">Code de vérification</legend>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={d}
              onChange={(e) => setAt(i, e.target.value)}
              onKeyDown={(e) => onKeyDown(i, e)}
              onPaste={onPaste}
              onFocus={(e) => e.target.select()}
              inputMode="numeric"
              autoComplete={i === 0 ? "one-time-code" : "off"}
              maxLength={1}
              autoFocus={i === 0}
              aria-label={`Chiffre ${i + 1}`}
              className={cn(
                "h-14 w-11 rounded-md border-2 bg-ink text-center text-2xl font-extrabold text-white transition-colors focus:border-primary focus:outline-none sm:h-16 sm:w-13",
                verify.isError ? "border-danger" : d ? "border-primary/70" : "border-line",
              )}
            />
          ))}
        </fieldset>

        {verify.isError && (
          <p className="mt-3 text-sm text-[#f87171]" role="alert">
            Code incorrect ou expiré. Réessayez.
          </p>
        )}

        <Button size="lg" fullWidth className="mt-7" disabled={!complete} loading={verify.isPending} onClick={() => submit()}>
          Vérifier le code
        </Button>

        <p className="mt-6 flex items-center gap-1 text-sm text-muted">
          Vous n&apos;avez pas reçu le code ?
          {resend.isPending ? (
            <Spinner className="size-4 text-primary" />
          ) : countdown > 0 ? (
            <span className="font-semibold text-muted">Renvoyer ({countdown}s)</span>
          ) : (
            <button type="button" onClick={onResend} className="font-bold text-primary hover:underline">
              Renvoyer
            </button>
          )}
        </p>
        <p className="mt-2 text-xs text-muted">Le code expire dans 15 minutes</p>
      </div>
      <AdminRedirectDialog open={adminOpen} onClose={() => setAdminOpen(false)} />
    </AuthScreen>
  );
}
