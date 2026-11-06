// Modèles de données de l'API LCC (mêmes contrats que l'application mobile)

export type UserRole = "admin" | "maitre_salle" | "athlete";

export interface User {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;          // facultatif pour les comptes créés par un maître ou l'admin
  identifiant?: string | null;   // permet alors de se connecter sans email
  role: UserRole;
  telephone?: string | null;
  photo_url?: string | null;
  created_at?: string;
}

/** Réponse de création d'un compte pour quelqu'un d'autre (athlète par son maître). */
export interface CreatedAccount {
  user: User;
  identifiant: string;
  mot_de_passe_provisoire: string;
  email_envoye: boolean;
}

export type Grade = "blanc" | "jaune" | "orange" | "vert" | "bleu" | "rouge" | "noir";

export interface Athlete {
  id: string;
  user_id: string;
  nom?: string;
  prenom?: string;
  email?: string;
  photo_url?: string | null;
  user?: User;
  date_naissance?: string | null;
  sexe?: "M" | "F" | null;
  categorie_poids?: string | null;
  grade?: Grade | null;
  club_id?: string | null;
  club?: Club | null;
  licence_url?: string | null;
  certificat_medical_url?: string | null;
  numero_licence?: string | null;
  licence_expiration?: string | null;
  statut_club?: "en_attente" | "valide" | "refuse" | null;
  nb_competitions?: number;
  created_at?: string;
}

export interface Club {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  code_postal?: string | null;
  pays?: string | null;
  description?: string | null;
  logo_url?: string | null;
  photos_urls?: string[] | null;
  documents_urls?: string[] | null;
  statut: "en_attente" | "valide" | "suspendu";
  prix_mensuel?: number | null;
  prix_annuel?: number | null;
  horaires?: Record<string, string> | null;
  equipements?: string[] | null;
  disciplines?: string[] | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  maitre?: User;
  distance?: number;
}

export type EventType = "competition" | "passage_grade" | "stage" | "cours_special";

export interface LeagueEvent {
  id: string;
  titre: string;
  type: EventType;
  adresse: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  date_debut: string;
  date_fin: string;
  places_total: number;
  places_disponibles: number | null;
  statut: "brouillon" | "publie" | "annule" | "termine";
  date_limite_inscription?: string | null;
  description?: string | null;
  organisateur?: string | null;
  mon_inscription?: Inscription | null;
}

export type InscriptionStatut = "propose" | "en_attente" | "confirme" | "refuse" | "annule";

export interface Inscription {
  id: string;
  statut: InscriptionStatut;
  athlete?: Athlete;
  commentaire?: string | null;
  resultat?: string | null;
  points?: number | null;
}

export interface MyInscription {
  id: string;
  statut: InscriptionStatut;
  commentaire?: string | null;
  resultat?: string | null;
  event: LeagueEvent;
}

export type CourseLevel = "debutant" | "intermediaire" | "avance" | "tous";

export interface Course {
  id: string;
  titre: string;
  description?: string | null;
  niveau: CourseLevel;
  date_debut: string;
  date_fin: string;
  places_total: number;
  places_disponibles: number | null;
  est_recurrent: boolean;
  recurrence?: "quotidien" | "hebdomadaire" | "mensuel" | null;
  jours_recurrence?: Array<string | number> | null;
  statut?: "actif" | "annule";
  club?: Club;
}

export interface Reservation {
  id: string;
  statut: "confirme" | "liste_attente" | "annule";
  position_attente?: number | null;
  course?: Course;
  athlete?: Athlete;
  created_at: string;
}

export type Discipline = "taekwondo_sport" | "taekwondo_traditionnel" | "poomsae" | "self_defense";

export interface Technique {
  id: string;
  nom_fr: string;
  nom_korean?: string | null;
  discipline: Discipline;
  niveau: "debutant" | "intermediaire" | "avance";
  type: string;
  description?: string | null;
  illustration_url?: string | null;
  video_url?: string | null;
  disponible_offline?: boolean;
  est_favori?: boolean;
}

export interface FavoriTechnique {
  technique_id: string;
  technique: Technique;
}

export interface Badge {
  id: string;
  nom: string;
  description?: string | null;
  type: "competition" | "grade" | "assiduite" | "anciennete" | "special";
  icone_url?: string | null;
  obtenu_le?: string;
}

/** Entrée de /athletes/me/badges : le badge est imbriqué */
export interface AthleteBadge {
  id: string;
  badge_id?: string;
  contexte?: string | null;
  obtenu_le?: string;
  badge?: Badge;
  // certains environnements renvoient directement le badge
  nom?: string;
  icone_url?: string | null;
}

export interface AppNotification {
  id: string;
  titre: string;
  message: string;
  type: string;
  est_lue: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  notif_cours: boolean;
  notif_evenements: boolean;
  notif_inscriptions: boolean;
  notif_validations: boolean;
  notif_badges: boolean;
  rappel_j1: boolean;
  rappel_h2: boolean;
}

export interface Ranking {
  id?: string;
  position: number;
  points: number;
  categorie: "poids" | "grade" | "age";
  valeur_categorie: string;
  saison: string;
}

export interface GradeHistorique {
  grade: Grade;
  date: string;
  commentaire?: string | null;
}

export interface AthleteHistorique {
  grades: GradeHistorique[];
  competitions: Array<{ event_id: string; titre: string; resultat?: string; points?: number; date?: string }>;
}

export interface Invitation {
  id: string;
  email_invite: string;
  statut: "en_attente" | "acceptee" | "expiree";
  created_at: string;
  expire_le: string;
}

export interface InvitationSendResult {
  envoyees: Invitation[];
  erreurs: Array<{ email: string; raison: string }>;
}

export interface ClubDocument {
  path: string;
  url: string;
  filename: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: { page: number; limit: number; total: number; last_page: number };
}
