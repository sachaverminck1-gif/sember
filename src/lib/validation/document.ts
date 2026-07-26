// Validation des devis et factures.
import { z } from "zod";

const ligneSchema = z.object({
  designation: z.string().trim().min(1, "La désignation est obligatoire").max(300),
  quantite: z.coerce
    .number()
    .positive("La quantité doit être supérieure à 0")
    .max(100000),
  prixUnitaire: z.coerce
    .number()
    .min(0, "Le prix ne peut pas être négatif")
    .max(1000000),
  tauxTVA: z.coerce.number().min(0).max(100).default(0),
});

export const devisSchema = z.object({
  clientId: z.string().min(1, "Sélectionnez un client"),
  objet: z.string().trim().max(200).optional().or(z.literal("")),
  dateDevis: z.coerce.date().optional(),
  validiteJours: z.coerce.number().int().min(1).max(365).default(30),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  lignes: z.array(ligneSchema).min(1, "Ajoutez au moins une ligne au devis"),
});

export const factureSchema = z.object({
  clientId: z.string().min(1, "Sélectionnez un client"),
  objet: z.string().trim().max(200).optional().or(z.literal("")),
  dateEmission: z.coerce.date().optional(),
  dateEcheance: z.coerce.date().optional().nullable(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  lignes: z.array(ligneSchema).min(1, "Ajoutez au moins une ligne à la facture"),
});

export const statutDevisSchema = z.object({
  statut: z.enum(["BROUILLON", "ENVOYE", "ACCEPTE", "REFUSE"]),
});

export const statutFactureSchema = z.object({
  statut: z.enum(["BROUILLON", "EMISE", "PAYEE", "ANNULEE"]),
});

export type DevisInput = z.infer<typeof devisSchema>;
export type FactureInput = z.infer<typeof factureSchema>;
export type LigneInput = z.infer<typeof ligneSchema>;
