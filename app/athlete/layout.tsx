import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = { title: { default: "Espace athlète", template: "%s · LCC Taekwondo" } };

export default function AthleteLayout({ children }: LayoutProps<"/athlete">) {
  return <AppShell role="athlete">{children}</AppShell>;
}
