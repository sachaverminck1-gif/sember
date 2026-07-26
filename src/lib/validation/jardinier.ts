// Schémas de validation des entrées liées au compte jardinier.
import { z } from "zod";

export const inscriptionSchema = z.object({
  nom: z.string().trim().min(2, "Le nom doit faire au moins 2 caractères").max(100),
  email: z.string().trim().toLowerCase().email("Adresse email invalide"),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères").max(200),
  entreprise: z.string().trim().max(150).optional().or(z.literal("")),
  telephone: z.string().trim().max(20).optional().or(z.literal("")),
  assujettiTVA: z.boolean().optional().default(false),
});

export type InscriptionInput = z.infer<typeof inscriptionSchema>;
