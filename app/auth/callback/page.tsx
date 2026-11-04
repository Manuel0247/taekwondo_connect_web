import { Suspense } from "react";
import { SplashScreen } from "@/components/layout/app-shell";
import { OAuthCallback } from "./oauth-callback";

export default function CallbackPage() {
  return (
    <Suspense fallback={<SplashScreen />}>
      <OAuthCallback />
    </Suspense>
  );
}
