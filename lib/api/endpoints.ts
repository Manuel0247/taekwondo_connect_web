// Endpoints de l'API /api/v1 — mêmes appels que src/api/* de l'application mobile.
import { api, unwrap, type Envelope } from "./client";
import type {
  Athlete, AthleteBadge, AthleteHistorique, AppNotification, Club, ClubDocument, Course, CreatedAccount,
  FavoriTechnique, Grade, Inscription, Invitation, InvitationSendResult, LeagueEvent,
  MyInscription, NotificationPreferences, Ranking, Reservation, Technique, User,
} from "../types";

export type Paginated<T> = { items: T[]; page: number; lastPage: number; total: number };

async function paginated<T>(
  p: Promise<{ data: Envelope<T[]> & { pagination?: { page: number; last_page: number; total: number } } }>,
): Promise<Paginated<T>> {
  const { data } = await p;
  return {
    items: data.data ?? [],
    page: data.pagination?.page ?? 1,
    lastPage: data.pagination?.last_page ?? 1,
    total: data.pagination?.total ?? (data.data?.length ?? 0),
  };
}

// ── Auth ────────────────────────────────────────────────────────────────────
export interface RegisterAthletePayload {
  nom: string; prenom: string; email: string;
  mot_de_passe: string; mot_de_passe_confirmation: string;
}
export interface RegisterClubPayload extends RegisterAthletePayload {
  telephone?: string;
  club_nom: string;
  description?: string;
  adresse: string;
  ville: string;
  code_postal?: string;
  latitude: number;
  longitude: number;
  disciplines?: string[];
  prix_mensuel?: number;
  prix_annuel?: number;
}
export interface AuthResponse { user: User; token: string }

export const authApi = {
  login: (p: { email: string; mot_de_passe: string }) =>
    unwrap(api.post<Envelope<AuthResponse>>("/auth/login", p)),
  registerAthlete: (p: RegisterAthletePayload) =>
    unwrap(api.post<Envelope<{ email: string }>>("/auth/register/athlete", p)),
  registerClub: (p: RegisterClubPayload) =>
    unwrap(api.post<Envelope<{ email: string }>>("/auth/register/club", p)),
  verifyOtp: (p: { email: string; code: string }) =>
    unwrap(api.post<Envelope<AuthResponse>>("/auth/otp/verify", p)),
  resendOtp: (email: string) => api.post("/auth/otp/resend", { email }),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (p: { email: string; code: string; mot_de_passe: string; mot_de_passe_confirmation: string }) =>
    api.post("/auth/reset-password", p),
  logout: (token?: string) =>
    api.post("/auth/logout", null, token ? { headers: { Authorization: `Bearer ${token}` } } : undefined),
};

// ── Utilisateur ─────────────────────────────────────────────────────────────
export const usersApi = {
  me: () =>
    unwrap(api.get<Envelope<User & { notification_preference?: NotificationPreferences | null; telephone?: string | null }>>("/users/me")),
  updateMe: (p: { nom?: string; prenom?: string; telephone?: string | null }) =>
    unwrap(api.put<Envelope<User>>("/users/me", p)),
  changePassword: (p: { ancien_mot_de_passe: string; mot_de_passe: string; mot_de_passe_confirmation: string }) =>
    api.put("/users/me/password", p),
};

// ── Athlètes ────────────────────────────────────────────────────────────────
export const athletesApi = {
  me: () => unwrap(api.get<Envelope<Athlete>>("/athletes/me")),
  updateMe: (p: { date_naissance?: string; sexe?: string; categorie_poids?: string }) =>
    unwrap(api.put<Envelope<Athlete>>("/athletes/me", p)),
  updateDocuments: (p: { licence_url?: string; certificat_medical_url?: string }) =>
    api.put("/athletes/me/documents", p),
  historique: () => unwrap(api.get<Envelope<AthleteHistorique>>("/athletes/me/historique")),
  badges: () => unwrap(api.get<Envelope<AthleteBadge[]>>("/athletes/me/badges")),
  classement: () => unwrap(api.get<Envelope<Ranking[]>>("/athletes/me/classement")),
  joinClub: (club_id: string) =>
    unwrap(api.put<Envelope<{ statut_club?: string }>>("/athletes/me/club", { club_id })),
  reservations: () => unwrap(api.get<Envelope<Reservation[]>>("/athletes/me/reservations")),
  inscriptions: () => unwrap(api.get<Envelope<MyInscription[]>>("/athletes/me/inscriptions")),

  // Maître de salle
  clubAthletes: () => unwrap(api.get<Envelope<Athlete[]>>("/clubs/me/athletes", { params: { limit: 500 } })),
  clubAthletesPending: () => unwrap(api.get<Envelope<Athlete[]>>("/clubs/me/athletes/pending")),
  createInClub: (p: {
    nom: string; prenom: string; email?: string; telephone?: string;
    sexe?: "M" | "F"; categorie_poids?: string; grade?: Grade;
  }) => unwrap(api.post<Envelope<CreatedAccount>>("/clubs/me/athletes", p)),
  validate: (id: string) => api.put(`/clubs/me/athletes/${id}/validate`),
  reject: (id: string, motif: string) => api.put(`/clubs/me/athletes/${id}/reject`, { motif }),
  remove: (id: string) => api.delete(`/clubs/me/athletes/${id}`),
  resetPassword: (id: string) => unwrap(api.put<Envelope<CreatedAccount>>(`/clubs/me/athletes/${id}/password`)),
  updateGrade: (id: string, grade: Grade) => api.put(`/clubs/me/athletes/${id}/grade`, { grade }),
  detail: (id: string) => unwrap(api.get<Envelope<Athlete>>(`/athletes/${id}`)),
  updateDocsByMaitre: (id: string, p: { licence_url?: string; certificat_medical_url?: string }) =>
    api.put(`/clubs/me/athletes/${id}/documents`, p),
  updateLicenceByMaitre: (id: string, p: { numero_licence?: string; licence_expiration?: string }) =>
    api.put(`/clubs/me/athletes/${id}/licence`, p),
};

// ── Clubs ───────────────────────────────────────────────────────────────────
export type ClubFilters = { q?: string; ville?: string; discipline?: string; prix_max?: number };

export const clubsApi = {
  list: (params: ClubFilters & { page?: number; limit?: number }) =>
    paginated<Club>(api.get("/clubs", { params })),
  detail: (id: string) => unwrap(api.get<Envelope<Club>>(`/clubs/${id}`)),
  me: () => unwrap(api.get<Envelope<Club>>("/clubs/me")),
  updateMe: (p: Partial<Club>) => unwrap(api.put<Envelope<Club>>("/clubs/me", p)),
  updatePhotos: (photos_urls: string[]) => api.put("/clubs/me/photos", { photos_urls }),
  updateHoraires: (horaires: Record<string, string>) => api.put("/clubs/me/horaires", { horaires }),
  documents: () => unwrap(api.get<Envelope<ClubDocument[]>>("/clubs/me/documents")),
  uploadDocument: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/clubs/me/documents", fd);
  },
  deleteDocument: (filename: string) => api.delete(`/clubs/me/documents/${encodeURIComponent(filename)}`),
};

// ── Cours ───────────────────────────────────────────────────────────────────
export type CoursePayload = {
  titre: string;
  description?: string;
  niveau: string;
  places_total: number;
  date_debut: string;
  date_fin: string;
  est_recurrent: boolean;
  recurrence?: string;
  jours_recurrence?: number[];
};

export const coursesApi = {
  // Cours à venir uniquement (les cours passés ne sont plus réservables)
  byClub: (clubId: string) =>
    unwrap(api.get<Envelope<Course[]>>(`/clubs/${clubId}/courses`, { params: { a_venir: 1, limit: 100 } })),
  mine: () => unwrap(api.get<Envelope<Course[]>>("/clubs/me/courses", { params: { limit: 200 } })),
  create: (p: CoursePayload) => unwrap(api.post<Envelope<Course>>("/clubs/me/courses", p)),
  remove: (id: string) => api.delete(`/clubs/me/courses/${id}`),
  detail: (id: string) => unwrap(api.get<Envelope<Course>>(`/courses/${id}`)),
  reservations: (id: string) => unwrap(api.get<Envelope<Reservation[]>>(`/courses/${id}/reservations`)),
  reserve: (id: string) => unwrap(api.post<Envelope<Reservation>>(`/courses/${id}/reservations`)),
  cancelReservation: (id: string) => api.delete(`/courses/${id}/reservations/me`),
};

// ── Événements ──────────────────────────────────────────────────────────────
export const eventsApi = {
  list: (params?: { type?: string; statut?: string; limit?: number }) =>
    unwrap(api.get<Envelope<LeagueEvent[]>>("/events", { params })),
  detail: (id: string) => unwrap(api.get<Envelope<LeagueEvent>>(`/events/${id}`)),
  inscriptions: (id: string) => unwrap(api.get<Envelope<Inscription[]>>(`/events/${id}/inscriptions`)),
  propose: (id: string, athletes: string[]) => api.post(`/events/${id}/inscriptions`, { athletes }),
  removeInscription: (eventId: string, inscriptionId: string) =>
    api.delete(`/events/${eventId}/inscriptions/${inscriptionId}`),
};

// ── Invitations ─────────────────────────────────────────────────────────────
export const invitationsApi = {
  list: () => unwrap(api.get<Envelope<Invitation[]>>("/clubs/me/invitations", { params: { limit: 100 } })),
  send: (emails: string[]) =>
    unwrap(api.post<Envelope<InvitationSendResult>>("/clubs/me/invitations", { emails })),
  resend: (id: string) => api.post(`/clubs/me/invitations/${id}/resend`),
  remove: (id: string) => api.delete(`/clubs/me/invitations/${id}`),
};

// ── Notifications ───────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => unwrap(api.get<Envelope<AppNotification[]>>("/users/me/notifications", { params: { limit: 50 } })),
  unreadCount: () => unwrap(api.get<Envelope<{ count: number }>>("/users/me/notifications/unread-count")),
  markRead: (id: string) => api.put(`/users/me/notifications/${id}/read`),
  // Pas d'endpoint dédié : les préférences sont incluses dans le profil (/users/me)
  updatePreferences: (p: Partial<NotificationPreferences>) => api.put("/users/me/notifications/preferences", p),
};

// ── Techniques ──────────────────────────────────────────────────────────────
export const techniquesApi = {
  list: (params?: { discipline?: string; niveau?: string; limit?: number }) =>
    unwrap(api.get<Envelope<Technique[]>>("/techniques", { params: { limit: 200, ...params } })),
  search: (q: string) => unwrap(api.get<Envelope<Technique[]>>("/techniques/search", { params: { q } })),
  detail: (id: string) => unwrap(api.get<Envelope<Technique>>(`/techniques/${id}`)),
  addFavori: (id: string) => api.post(`/techniques/${id}/favoris`),
  removeFavori: (id: string) => api.delete(`/techniques/${id}/favoris`),
  favoris: () => unwrap(api.get<Envelope<FavoriTechnique[]>>("/users/me/favoris/techniques")),
};

// ── Uploads (multipart) ─────────────────────────────────────────────────────
type UploadTarget = { model: "user" | "club" | "athlete"; model_id: string; collection: string };

function uploadForm(file: File, t: UploadTarget) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("model", t.model);
  fd.append("model_id", t.model_id);
  fd.append("collection", t.collection);
  return fd;
}

export const uploadsApi = {
  image: async (file: File, t: UploadTarget) =>
    (await unwrap(api.post<Envelope<{ url: string }>>("/uploads/image", uploadForm(file, t), { timeout: 120000 }))).url,
  document: async (file: File, t: UploadTarget) =>
    (await unwrap(api.post<Envelope<{ url: string }>>("/uploads/document", uploadForm(file, t), { timeout: 120000 }))).url,
};
