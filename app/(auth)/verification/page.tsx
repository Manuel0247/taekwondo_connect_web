import { Suspense } from "react";
import type { Metadata } from "next";
import { OtpForm } from "./otp-form";

export const metadata: Metadata = { title: "Vérification de l'email" };

export default function VerifyPage() {
  return (
    <Suspense>
      <OtpForm />
    </Suspense>
  );
}
