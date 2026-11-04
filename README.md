# LCC Taekwondo — application web

Version web responsive de l'application mobile `taekwondo_connect_frontend` (Expo), pour les **athlètes** et les **maîtres de salle**. Elle utilise la même API Laravel (`taekwondo_connect_backend`). Les administrateurs sont redirigés vers le webadmin.

## Démarrer

Prérequis : XAMPP + MySQL démarrés, puis l'API (`php artisan serve --host=0.0.0.0 --port=8000`).

```bash
npm install
npm run dev        # http://localhost:3001 (le webadmin occupe le port 3000)
# production
npm run build && npm start
```

`.env.local` (voir `.env.example`) :

| Variable | Rôle |
|---|---|
| `NEXT_PUBLIC_API_URL` | API Laravel, ex. `http://localhost:8000/api/v1` |
| `NEXT_PUBLIC_WEBADMIN_URL` | Webadmin vers lequel les comptes admin sont envoyés |

Comptes de test : `jean.konan@gmail.com / Athlete@1234`, `franck.kouassi@lcc-tkd.ci / Maitre@1234`.

## Stack

Next.js 16 (App Router, Cache Components, Partial Prefetching) · React 19 · Tailwind CSS 4 · TanStack Query · Axios · Zustand · React Hook Form + Zod · Sonner · lucide-react · **Leaflet + React Leaflet** (tuiles OpenStreetMap).

## Organisation

```
app/
  (auth)/            connexion, inscription athlète / club (3 étapes + carte), vérification OTP, mot de passe
  auth/callback/     retour de la connexion Google
  athlete/           accueil, clubs (liste + carte), événements, calendrier, techniques, profil…
  maitre/            dashboard, club, cours, événements, athlètes, invitations, calendrier, profil…
components/
  ui/                Button, Input, Dialog (feuille mobile / modale desktop), Chip, Switch, Badge…
  layout/            AppShell (onglets / rail / barre latérale), PageHeader
  domain/            cartes métier (club, cours, événement, technique…), calendrier, grades
  maps/              cartes Leaflet chargées côté navigateur uniquement
  screens/           écrans partagés entre rôles (notifications, préférences, compte, calendrier)
lib/
  api/               client Axios + tous les endpoints (mêmes appels que src/api du mobile)
  hooks/             requêtes et mutations TanStack Query (mêmes clés et messages que le mobile)
  config.ts          charte, libellés et couleurs métier (grades, types d'événements…)
proxy.ts             protection des espaces par rôle
```

## Responsive (mobile first)

| Largeur | Navigation | Mise en page |
|---|---|---|
| < 768 px | Barre d'onglets en bas (comme le mobile), zones de sécurité | Une colonne, feuilles modales en bas d'écran |
| 768–1023 px | Rail d'icônes latéral | Grilles 2 colonnes |
| ≥ 1024 px | Barre latérale complète (raccourcis, compte) | Tableaux de bord multi-colonnes, vue liste + carte, tableau des athlètes |

## Choix techniques

- **Session** : jeton Sanctum dans le cookie `lcc_web_token` (+ `lcc_web_role`) lu par `proxy.ts` pour rediriger sans flash ; noms distincts du webadmin car les cookies de `localhost` sont partagés entre ports. Une réponse 401 déconnecte et affiche « Session expirée ».
- **Rendu** : la session vit dans le navigateur ; les pages connectées sont rendues côté client (comme le mobile). Les paramètres d'URL sont lus sous `<Suspense>` comme l'exige Cache Components.
- **Disciplines** : le web envoie les codes (`taekwondo_sport`, `poomsae`…) utilisés par les clubs existants et par le filtre de recherche.
- **Hors-ligne (techniques)** : le mobile copie les fichiers sur le téléphone ; le web garde le catalogue dans `localStorage` et précharge les illustrations. La liste reste consultable si l'API est injoignable.
- **Vidéos** : lecteur HTML5 pour les fichiers, lecteur YouTube intégré, lien pour les autres plateformes.
- **Cartes** : tuiles OpenStreetMap assombries en CSS (les fonds CARTO exigent désormais une clé d'API).

## Vérifications

```bash
npm run typecheck && npm run lint && npm run build
```
