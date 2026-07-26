// Validation des entrées du carnet de clients.
import { z } from "zod";

export const clientSchema = z.object({
  nom: z.string().trim().min(2, "Le nom doit faire au moins 2 caractères").max(150),
  adresse: z.string().trim().max(250).optional().or(z.literal("")),
  codePostal: z.string().trim().max(10).optional().or(z.literal("")),
  ville: z.string().trim().max(100).optional().or(z.literal("")),
  telephone: z.string().trim().max(20).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Adresse email invalide")
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;

/** Normalise les champs optionnels vides en null pour la base. */
export function normaliserClient(input: ClientInput) {
  return {
    nom: input.nom,
    adresse: input.adresse || null,
    codePostal: input.codePostal || null,
    ville: input.ville || null,
    telephone: input.telephone || null,
    email: input.email || null,
    notes: input.notes || null,
  };
}
