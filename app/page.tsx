import { redirect } from "next/navigation";

// proxy.ts redirige déjà "/" selon la session ; repli si le proxy est contourné.
export default function Index() {
  redirect("/connexion");
}
