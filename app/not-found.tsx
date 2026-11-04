import Image from "next/image";
import { LinkButton } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Image src="/images/logo.png" alt="LCC Taekwondo" width={120} height={120} className="mx-auto rounded-md" />
        <p className="mt-6 text-6xl font-extrabold text-primary">404</p>
        <h1 className="mt-2 text-xl font-bold text-white">Page introuvable</h1>
        <p className="mt-2 text-sm text-muted">Cette page n&apos;existe pas ou a été déplacée.</p>
        <LinkButton href="/" className="mt-6">
          Retour à l&apos;accueil
        </LinkButton>
      </div>
    </main>
  );
}
