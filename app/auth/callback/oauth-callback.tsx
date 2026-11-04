"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApplySession } from "@/lib/hooks/auth";
import type { User } from "@/lib/types";
import { SplashScreen } from "@/components/layout/app-shell";
import { AdminRedirectDialog } from "@/components/auth/auth-ui";

// Retour de Laravel après Google : ?token=…&user=<base64 JSON> ou ?error=…
function parseUser(raw: string): User | null {
  try {
    return JSON.parse(decodeURIComponent(raw)) as User;
  } catch {
    try {
      const bin = atob(raw);
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes)) as User;
    } catch {
      return null;
    }
  }
}

export function OAuthCallback() {
  const params = useSearchParams();
  const router = useRouter();
  const apply = useApplySession();
  const [adminOpen, setAdminOpen] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    const error = params.get("error");
    const token = params.get("token");
    const rawUser = params.get("user");
    const user = rawUser ? parseUser(rawUser) : null;
    if (error || !token || !user) {
      router.replace(`/connexion?error=${encodeURIComponent(error ?? "Réponse invalide du serveur")}`);
      return;
    }
    apply({ token, user }, () => setAdminOpen(true));
  }, [params, router, apply]);

  return (
    <>
      <SplashScreen />
      <AdminRedirectDialog
        open={adminOpen}
        onClose={() => {
          setAdminOpen(false);
          router.replace("/connexion");
        }}
      />
    </>
  );
}
