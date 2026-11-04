import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

// Charte : Inter 400 / 600 / 700 / 800
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "LCC Taekwondo",
    template: "%s · LCC Taekwondo",
  },
  description:
    "Ligue Communale de Cocody — clubs, cours, événements et techniques de Taekwondo pour les athlètes et les maîtres de salle.",
  applicationName: "LCC Taekwondo",
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-ink">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
