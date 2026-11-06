// Libellés et couleurs métier (repris des écrans et composants mobiles)
import type { CourseLevel, EventType, Grade, InscriptionStatut, Discipline } from "./types";

export const COLORS = {
  primary: "#E8650A",
  primaryLight: "#F5A05C",
  secondary: "#1B7A3F",
  secondaryLight: "#2EA55A",
  ink: "#0A0A0A",
  surface: "#1C1C1E",
  line: "#3A3A3C",
  muted: "#8E8E93",
  danger: "#DC2626",
  info: "#1E40AF",
  infoLight: "#3B82F6",
  purple: "#7C3AED",
  warning: "#F59E0B",
} as const;

export const GRADES: Grade[] = ["blanc", "jaune", "orange", "vert", "bleu", "rouge", "noir"];

export const DAN_MAX = 9;
export const DANS = Array.from({ length: DAN_MAX }, (_, i) => i + 1);

/** « 1er dan », « 2e dan »… */
export function danLabel(dan: number): string {
  return `${dan}${dan === 1 ? "er" : "e"} dan`;
}

/** Tarif d'un événement à tarif variable pour un grade (dan pour la ceinture noire, ancien tarif « noir » à défaut) */
export function tarifPourGrade(prixParGrade: Partial<Record<string, number>> | null | undefined, grade?: Grade | null, dan?: number | null): number | undefined {
  if (!grade || !prixParGrade) return undefined;
  return (grade === "noir" && dan ? prixParGrade[`noir_${dan}`] : undefined) ?? prixParGrade[grade];
}

/** Grades ayant un tarif propre : ceintures de couleur, puis chaque dan (clé API « noir_2 ») */
export const TARIF_GRADES: { key: string; grade: Grade; dan?: number }[] = [
  ...GRADES.filter((g) => g !== "noir").map((g) => ({ key: g, grade: g })),
  ...DANS.map((d) => ({ key: `noir_${d}`, grade: "noir" as Grade, dan: d })),
];

export const GRADE_COLORS: Record<Grade, { bg: string; text: string; border?: string }> = {
  blanc: { bg: "#E5E5EA", text: "#3A3A3C" },
  jaune: { bg: "#FFD700", text: "#1C1C1E" },
  orange: { bg: "#FF8C00", text: "#FFFFFF" },
  vert: { bg: "#1B7A3F", text: "#FFFFFF" },
  bleu: { bg: "#1E40AF", text: "#FFFFFF" },
  rouge: { bg: "#DC2626", text: "#FFFFFF" },
  noir: { bg: "#0A0A0A", text: "#FFFFFF", border: "#3A3A3C" },
};

export const GRADE_SHORT: Record<Grade, string> = {
  blanc: "Blanc",
  jaune: "Jaune",
  orange: "Orange",
  vert: "Vert",
  bleu: "Bleu",
  rouge: "Rouge",
  noir: "Noir",
};

export const GRADE_LABELS: Record<Grade, string> = {
  blanc: "Ceinture Blanche",
  jaune: "Ceinture Jaune",
  orange: "Ceinture Orange",
  vert: "Ceinture Verte",
  bleu: "Ceinture Bleue",
  rouge: "Ceinture Rouge",
  noir: "Ceinture Noire",
};

/** Couleur lisible sur fond sombre (le noir et le bleu foncé sont éclaircis) */
export function gradeAccent(g: Grade): string {
  if (g === "noir") return "#E5E5EA";
  if (g === "bleu") return "#3B82F6";
  return GRADE_COLORS[g].bg;
}

export const EVENT_TYPES: Record<EventType, { label: string; color: string }> = {
  competition: { label: "Compétition", color: COLORS.primary },
  stage: { label: "Stage", color: COLORS.secondary },
  passage_grade: { label: "Passage de grade", color: COLORS.infoLight },
  cours_special: { label: "Cours spécial", color: COLORS.purple },
};

export const INSCRIPTION_STATUS: Record<InscriptionStatut, { label: string; color: string }> = {
  propose: { label: "Proposé", color: COLORS.warning },
  en_attente: { label: "En attente", color: COLORS.warning },
  confirme: { label: "Confirmé", color: COLORS.secondaryLight },
  refuse: { label: "Refusé", color: COLORS.danger },
  annule: { label: "Annulé", color: COLORS.muted },
};

export const COURSE_LEVELS: Record<CourseLevel, { label: string; color: string }> = {
  debutant: { label: "Débutant", color: COLORS.secondary },
  intermediaire: { label: "Intermédiaire", color: COLORS.primary },
  avance: { label: "Avancé", color: COLORS.danger },
  tous: { label: "Tous niveaux", color: COLORS.info },
};

export const DISCIPLINE_LABELS: Record<Discipline, string> = {
  taekwondo_sport: "TKD Sport",
  taekwondo_traditionnel: "TKD Traditionnel",
  poomsae: "Poomsae",
  self_defense: "Self-Défense",
};

export const CLUB_STATUS = {
  en_attente: { label: "En attente", long: "En attente de validation", color: COLORS.primary },
  valide: { label: "Validé", long: "Club validé", color: COLORS.secondary },
  suspendu: { label: "Suspendu", long: "Club suspendu", color: COLORS.danger },
} as const;

export const JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"] as const;
export const JOURS_NUM: Record<string, number> = {
  lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6, dimanche: 7,
};
export const JOURS_SHORT: Record<string, string> = {
  lundi: "Lun", mardi: "Mar", mercredi: "Mer", jeudi: "Jeu", vendredi: "Ven", samedi: "Sam", dimanche: "Dim",
};

/** jours_recurrence peut contenir des noms ou des entiers ISO (1 = lundi) */
export function formatJours(jours?: Array<string | number> | null): string {
  if (!jours?.length) return "";
  return jours
    .map((j) => (typeof j === "number" || /^\d+$/.test(String(j)) ? JOURS[Number(j) - 1] : String(j)))
    .filter(Boolean)
    .map((j) => JOURS_SHORT[j as string] ?? j)
    .join(", ");
}

export const POIDS = ["-48kg", "-51kg", "-55kg", "-59kg", "-63kg", "-68kg", "-73kg", "-80kg", "+80kg"];

export const ABIDJAN: [number, number] = [5.3544, -4.0083];

/** Règle de mot de passe synchronisée avec l'API (8 car., 1 maj., 1 chiffre, 1 spécial) */
export const PASSWORD_HINT = "8 caractères min., 1 majuscule, 1 chiffre, 1 caractère spécial";
