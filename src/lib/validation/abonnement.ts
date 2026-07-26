// Validation des formules d'entretien et des abonnements.
import { z } from "zod";

export const formuleSchema = z.object({
  nom: z.string().trim().min(2, "Le nom doit faire au moins 2 caractères").max(150),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  frequence: z.enum(["HEBDOMADAIRE", "BIMENSUELLE", "MENSUELLE", "TRIMESTRIELLE"]),
  prixMensuel: z.coerce
    .number()
    .min(0, "Le prix ne peut pas être négatif")
    .max(100000),
});

export const abonnementSchema = z.object({
  clientId: z.string().min(1, "Sélectionnez un client"),
  formuleId: z.string().min(1, "Sélectionnez une formule"),
  dateDebut: z.coerce.date().optional(),
});

export const statutAbonnementSchema = z.object({
  statut: z.enum(["ACTIF", "SUSPENDU", "RESILIE"]),
});

export type FormuleInput = z.infer<typeof formuleSchema>;
export type AbonnementInput = z.infer<typeof abonnementSchema>;
