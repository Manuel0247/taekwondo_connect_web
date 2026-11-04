import { z } from "zod";

// Règles synchronisées avec l'API (règle métier 7) et les écrans mobiles
export const passwordRule = z
  .string()
  .min(8, "Minimum 8 caractères")
  .regex(/[A-Z]/, "1 majuscule requise")
  .regex(/[0-9]/, "1 chiffre requis")
  .regex(/[^a-zA-Z0-9]/, "1 caractère spécial requis");

export const emailRule = z.string().trim().email("Email invalide");

export const loginSchema = z.object({
  email: emailRule,
  mot_de_passe: z.string().min(1, "Mot de passe requis"),
});

export const registerAthleteSchema = z
  .object({
    prenom: z.string().trim().min(2, "Prénom requis"),
    nom: z.string().trim().min(2, "Nom requis"),
    email: emailRule,
    mot_de_passe: passwordRule,
    mot_de_passe_confirmation: z.string(),
  })
  .refine((d) => d.mot_de_passe === d.mot_de_passe_confirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ["mot_de_passe_confirmation"],
  });

const price = z
  .string()
  .optional()
  .refine(
    (v) => !v || (!isNaN(parseFloat(v)) && parseFloat(v) >= 0 && parseFloat(v) <= 9999999),
    "Prix invalide (max 9 999 999 FCFA)",
  );

export const registerClubSchema = z
  .object({
    prenom: z.string().trim().min(2, "Prénom requis"),
    nom: z.string().trim().min(2, "Nom requis"),
    email: emailRule,
    telephone: z.string().optional(),
    mot_de_passe: passwordRule,
    mot_de_passe_confirmation: z.string(),
    club_nom: z.string().trim().min(3, "Nom du club requis"),
    description: z.string().optional(),
    adresse: z.string().trim().min(5, "Adresse requise"),
    ville: z.string().trim().min(2, "Ville requise"),
    code_postal: z.string().optional(),
    prix_mensuel: price,
    prix_annuel: price,
  })
  .refine((d) => d.mot_de_passe === d.mot_de_passe_confirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ["mot_de_passe_confirmation"],
  });

export const resetPasswordSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, "Le code contient 6 chiffres"),
    mot_de_passe: passwordRule,
    mot_de_passe_confirmation: z.string(),
  })
  .refine((d) => d.mot_de_passe === d.mot_de_passe_confirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ["mot_de_passe_confirmation"],
  });

export const changePasswordSchema = z
  .object({
    ancien_mot_de_passe: z.string().min(1, "Mot de passe actuel requis"),
    mot_de_passe: passwordRule,
    mot_de_passe_confirmation: z.string(),
  })
  .refine((d) => d.mot_de_passe === d.mot_de_passe_confirmation, {
    message: "Les mots de passe ne correspondent pas",
    path: ["mot_de_passe_confirmation"],
  });

export const priceRule = price;
