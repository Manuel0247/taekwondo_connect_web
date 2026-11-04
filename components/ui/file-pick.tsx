"use client";

import { useRef, type ReactNode } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MAX_MB = 10; // limite de l'API (max:10240 Ko)

/**
 * Bouton ouvrant le sélecteur de fichiers du navigateur
 * (remplace expo-image-picker / expo-document-picker).
 */
export function FilePick({
  accept,
  multiple,
  onFiles,
  disabled,
  className,
  children,
  label,
  maxMb = MAX_MB,
}: {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  label?: string;
  maxMb?: number;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" disabled={disabled} onClick={() => ref.current?.click()} className={cn(className)} aria-label={label}>
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => {
          const files = Array.from(e.target.files ?? []);
          e.target.value = "";
          const tooBig = files.filter((f) => f.size > maxMb * 1024 * 1024);
          if (tooBig.length) toast.error(`Fichier trop volumineux (max ${maxMb} Mo)`, { description: tooBig.map((f) => f.name).join(", ") });
          const ok = files.filter((f) => f.size <= maxMb * 1024 * 1024);
          if (ok.length) onFiles(ok);
        }}
      />
    </>
  );
}

export function formatSize(bytes: number) {
  return bytes > 1024 * 1024 ? `${(bytes / 1048576).toFixed(1)} Mo` : `${Math.max(1, Math.round(bytes / 1024))} Ko`;
}
