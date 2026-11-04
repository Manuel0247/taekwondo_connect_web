"use client";

import { useEffect } from "react";
import { ErrorState } from "@/components/ui/display";

// Frontière d'erreur globale : une erreur de rendu ne laisse jamais un écran blanc
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <ErrorState message="Une erreur inattendue est survenue" description="Réessayez ; si le problème persiste, rechargez la page." onRetry={reset} />
    </main>
  );
}
