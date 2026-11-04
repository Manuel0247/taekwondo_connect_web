// L'API n'a pas de fichiers de traduction : elle renvoie des clés brutes ("validation.unique").
// Repris de src/utils/apiError.ts du mobile.
const VALIDATION_MESSAGES: Record<string, string> = {
  "validation.unique": "est déjà utilisé",
  "validation.required": "est obligatoire",
  "validation.email": "n'est pas une adresse email valide",
  "validation.confirmed": "ne correspond pas à la confirmation",
  "validation.min.string": "est trop court",
  "validation.max.string": "est trop long",
  "validation.numeric": "doit être un nombre",
  "validation.between.numeric": "est hors limites",
  "validation.exists": "est introuvable",
  "validation.uuid": "est invalide",
  "validation.date": "n'est pas une date valide",
  "validation.before": "doit être dans le passé",
  "validation.after": "doit être postérieure",
  "validation.in": "n'est pas une valeur autorisée",
  "validation.digits": "n'a pas le bon nombre de chiffres",
  "validation.date_format": "doit être au format AAAA-MM-JJ",
  "validation.mimes": "n'est pas d'un format accepté",
  "validation.max.file": "est trop volumineux",
  "validation.image": "doit être une image",
};

const FIELD_LABELS: Record<string, string> = {
  email: "L'email",
  mot_de_passe: "Le mot de passe",
  ancien_mot_de_passe: "L'ancien mot de passe",
  nom: "Le nom",
  prenom: "Le prénom",
  telephone: "Le téléphone",
  club_nom: "Le nom du club",
  adresse: "L'adresse",
  ville: "La ville",
  code_postal: "Le code postal",
  latitude: "La position",
  longitude: "La position",
  prix_mensuel: "Le prix mensuel",
  prix_annuel: "Le prix annuel",
  code: "Le code",
  numero_licence: "Le numéro de licence",
  licence_expiration: "La date d'expiration",
  date_debut: "La date de début",
  date_fin: "La date de fin",
  titre: "Le titre",
  places_total: "Le nombre de places",
  file: "Le fichier",
};

function formatDetail(field: string, message: string): string {
  if (field === "email" && message === "validation.unique") {
    return "Cet email est déjà utilisé. Connectez-vous ou vérifiez votre compte.";
  }
  const translated = VALIDATION_MESSAGES[message];
  if (!translated) return message;
  return `${FIELD_LABELS[field] ?? field} ${translated}`;
}

type ErrShape = {
  code?: string;
  response?: {
    status?: number;
    data?: {
      error?: { code?: string; message?: string; details?: Record<string, unknown> };
      message?: string;
    };
  };
  message?: string;
};

export function apiErrorCode(error: unknown): string | undefined {
  return (error as ErrShape)?.response?.data?.error?.code;
}

export function extractApiError(error: unknown): string {
  if (!error) return "Une erreur est survenue";
  const err = error as ErrShape;

  if (!err.response && (err.code === "ERR_NETWORK" || err.message === "Network Error")) {
    return "Serveur injoignable. Vérifiez votre connexion et réessayez.";
  }
  if (err.code === "ECONNABORTED") return "Le serveur met trop de temps à répondre.";

  const details = err.response?.data?.error?.details;
  if (details && typeof details === "object") {
    const [field, messages] = Object.entries(details)[0] ?? [];
    if (field && Array.isArray(messages) && typeof messages[0] === "string") {
      return formatDetail(field, messages[0]);
    }
  }

  return (
    err.response?.data?.error?.message ??
    err.response?.data?.message ??
    err.message ??
    "Une erreur est survenue"
  );
}
