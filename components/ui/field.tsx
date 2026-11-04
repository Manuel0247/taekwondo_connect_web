"use client";

import { forwardRef, useId, useState, type ComponentProps, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Champ de saisie de src/components/ui/Input.tsx (mobile) : libellé, icône, erreur, œil pour mot de passe
type InputProps = Omit<ComponentProps<"input">, "size"> & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  right?: ReactNode;
  secure?: boolean;
  containerClassName?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, leftIcon, right, secure, className, containerClassName, id, type, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [show, setShow] = useState(false);
  const describedBy = error ? `${inputId}-err` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className={cn("mb-4", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-white">
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex items-center rounded-md border-[1.5px] bg-surface transition-colors focus-within:border-primary",
          error ? "border-danger" : "border-line",
        )}
      >
        {leftIcon && <span className="pl-3.5 text-muted [&_svg]:size-[18px]">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={secure ? (show ? "text" : "password") : type}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-12 min-w-0 flex-1 bg-transparent px-3.5 text-[15px] text-white placeholder:text-muted focus:outline-none",
            className,
          )}
          {...rest}
        />
        {secure && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="px-3.5 text-muted hover:text-white"
            aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {show ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}
          </button>
        )}
        {right}
      </div>
      {error ? (
        <p id={`${inputId}-err`} className="mt-1 text-xs text-[#f87171]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

type TextareaProps = ComponentProps<"textarea"> & { label?: string; error?: string; containerClassName?: string };

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, className, containerClassName, id, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className={cn("mb-4", containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-white">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={4}
        aria-invalid={!!error || undefined}
        className={cn(
          "w-full resize-y rounded-md border-[1.5px] bg-surface px-3.5 py-3 text-[15px] text-white placeholder:text-muted focus:border-primary focus:outline-none",
          error ? "border-danger" : "border-line",
          className,
        )}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-[#f87171]">{error}</p>}
    </div>
  );
});

export function FieldLabel({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("mb-2 text-sm font-semibold text-white", className)}>{children}</p>;
}
