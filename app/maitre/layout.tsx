import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: { default: "Espace maître de salle", template: "%s · LCC Taekwondo" } };

export default function MaitreLayout({ children }: LayoutProps<"/maitre">) {
  return <AppShell role="maitre_salle">{children}</AppShell>;
}
