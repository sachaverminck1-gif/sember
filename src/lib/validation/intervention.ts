// Validation des interventions du planning.
import { z } from "zod";

export const interventionSchema = z.object({
  clientId: z.string().min(1, "Sélectionnez un client"),
  titre: z.string().trim().min(1, "Le titre est obligatoire").max(200),
  date: z.coerce.date(),
  dureeMinutes: z.coerce.number().int().min(15).max(24 * 60).default(60),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const statutInterventionSchema = z.object({
  statut: z.enum(["PLANIFIEE", "TERMINEE", "ANNULEE"]),
});

export type InterventionInput = z.infer<typeof interventionSchema>;
