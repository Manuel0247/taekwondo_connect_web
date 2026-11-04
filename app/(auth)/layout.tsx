import Image from "next/image";
import { CalendarCheck2, MapPinned, Trophy, Library } from "lucide-react";

const FEATURES = [
  { icon: MapPinned, title: "Trouvez votre club", text: "Clubs affiliés de la ligue, sur liste ou sur carte." },
  { icon: CalendarCheck2, title: "Réservez vos cours", text: "Places en temps réel et liste d'attente automatique." },
  { icon: Trophy, title: "Suivez les événements", text: "Compétitions, stages et passages de grade." },
  { icon: Library, title: "Progressez", text: "Bibliothèque de techniques, vidéos et favoris." },
];

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh bg-gradient-to-b from-ink to-surface lg:grid lg:grid-cols-[minmax(420px,1fr)_minmax(480px,1fr)] lg:bg-none">
      {/* Panneau de marque (desktop) */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-ink lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        <div
          className="pointer-events-none absolute -top-40 -left-40 size-[520px] rounded-full bg-primary/10 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex items-center gap-4">
          <Image src="/images/logo.png" alt="" width={72} height={72} className="rounded-md" priority />
          <div>
            <p className="text-xl font-extrabold text-white">LCC Taekwondo</p>
            <p className="text-sm text-muted">Ligue Communale de Cocody</p>
          </div>
        </div>
        <div className="relative max-w-lg">
          <h2 className="text-4xl leading-tight font-extrabold text-white xl:text-5xl">
            Toute la vie de la ligue,
            <span className="block text-primary">au même endroit.</span>
          </h2>
          <ul className="mt-10 grid grid-cols-1 gap-5 xl:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-surface text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">{title}</p>
                  <p className="text-sm text-muted">{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-muted">
          <span className="h-1 w-8 rounded-full bg-primary" />
          <span className="h-1 w-8 rounded-full bg-secondary" />
          <span className="ml-2">Côte d&apos;Ivoire</span>
        </div>
      </aside>

      {/* Formulaire */}
      <main className="flex min-h-dvh flex-col pt-safe pb-safe lg:min-h-0">{children}</main>
    </div>
  );
}
