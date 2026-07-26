// Garde de session côté serveur : récupère le jardinier connecté ou redirige.
// C'est LE point d'entrée obligatoire de toutes les pages et routes protégées —
// il garantit l'isolation multi-tenant (chaque requête part du jardinierId de session)
// et applique le paywall (essai expiré → lecture seule).
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Jardinier } from "@/generated/prisma/client";

export type JardinierSession = {
  jardinier: Jardinier;
  /** true si l'essai est expiré sans abonnement actif → lecture seule */
  lectureSeule: boolean;
};

/** Statuts qui donnent un accès en écriture. */
function accesEcriture(j: Jardinier): boolean {
  if (j.subscriptionStatus === "ACTIVE") return true;
  if (j.subscriptionStatus === "TRIAL" && j.trialEndsAt > new Date()) return true;
  return false;
}

/**
 * Pages serveur : renvoie le jardinier connecté, ou redirige vers /connexion.
 * Marque aussi le compte LOCKED en base si l'essai vient d'expirer.
 */
export async function getJardinierOrRedirect(): Promise<JardinierSession> {
  const session = await auth();
  if (!session?.jardinierId) redirect("/connexion");

  const jardinier = await prisma.jardinier.findUnique({
    where: { id: session.jardinierId },
  });
  if (!jardinier) redirect("/connexion");

  // Essai expiré et toujours marqué TRIAL → on bascule en LOCKED (lazy update).
  if (jardinier.subscriptionStatus === "TRIAL" && jardinier.trialEndsAt <= new Date()) {
    await prisma.jardinier.update({
      where: { id: jardinier.id },
      data: { subscriptionStatus: "LOCKED" },
    });
    jardinier.subscriptionStatus = "LOCKED";
  }

  return { jardinier, lectureSeule: !accesEcriture(jardinier) };
}

/**
 * Routes API : renvoie le jardinier connecté, ou null (la route renverra 401).
 */
export async function getJardinierForApi(): Promise<JardinierSession | null> {
  const session = await auth();
  if (!session?.jardinierId) return null;

  const jardinier = await prisma.jardinier.findUnique({
    where: { id: session.jardinierId },
  });
  if (!jardinier) return null;

  if (jardinier.subscriptionStatus === "TRIAL" && jardinier.trialEndsAt <= new Date()) {
    await prisma.jardinier.update({
      where: { id: jardinier.id },
      data: { subscriptionStatus: "LOCKED" },
    });
    jardinier.subscriptionStatus = "LOCKED";
  }

  return { jardinier, lectureSeule: !accesEcriture(jardinier) };
}
