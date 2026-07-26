// Règles de quotas par plan (D8) — différenciation MVP par quotas.
// Starter : 15 clients max. Pro/Business : illimité.
import { prisma } from "@/lib/prisma";
import type { Plan } from "@/generated/prisma/client";

export const QUOTA_CLIENTS: Record<Plan, number | null> = {
  STARTER: 15,
  PRO: null, // null = illimité
  BUSINESS: null,
};

/**
 * Vérifie si le jardinier peut créer un client supplémentaire.
 * Renvoie null si OK, sinon le message d'erreur à afficher.
 */
export async function verifierQuotaClients(
  jardinierId: string,
  plan: Plan
): Promise<string | null> {
  const limite = QUOTA_CLIENTS[plan];
  if (limite === null) return null;

  const actuel = await prisma.client.count({ where: { jardinierId } });
  if (actuel >= limite) {
    return `Votre formule Starter est limitée à ${limite} clients. Passez à la formule Pro pour un nombre illimité.`;
  }
  return null;
}
