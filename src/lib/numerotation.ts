// Numérotation séquentielle des devis et factures, par jardinier.
//
// Contrainte légale (art. 242 nonies A CGI) : les factures portent un numéro
// unique basé sur une séquence chronologique continue, sans trou ni doublon.
// Deux protections ici :
//  - le calcul du numéro se fait DANS la transaction qui crée le document ;
//  - la contrainte @@unique([jardinierId, numero]) rattrape toute collision
//    concurrente, et on réessaie.
//
// Conséquence assumée : on ne supprime jamais une facture émise (on l'annule),
// sinon la séquence aurait un trou.

import { Prisma } from "@/generated/prisma/client";

/** Erreur Prisma de violation de contrainte d'unicité. */
const CODE_CONFLIT_UNICITE = "P2002";

const NB_TENTATIVES = 5;

/**
 * Exécute `creer` en lui fournissant le prochain numéro disponible.
 * En cas de collision (deux documents créés simultanément), réessaie avec le
 * numéro suivant.
 */
export async function avecNumeroSequentiel<T>(
  prochainNumero: () => Promise<number>,
  creer: (numero: number) => Promise<T>
): Promise<T> {
  for (let tentative = 0; tentative < NB_TENTATIVES; tentative++) {
    const numero = await prochainNumero();
    try {
      return await creer(numero);
    } catch (erreur) {
      const estCollision =
        erreur instanceof Prisma.PrismaClientKnownRequestError &&
        erreur.code === CODE_CONFLIT_UNICITE;
      if (!estCollision) throw erreur;
      // Un autre document a pris ce numéro entre-temps : on recalcule.
    }
  }
  throw new Error(
    "Impossible d'attribuer un numéro de document après plusieurs tentatives"
  );
}

/** Formate un numéro pour l'affichage : 7 → "D-2026-0007". */
export function formaterNumeroDevis(numero: number, date: Date): string {
  return `D-${date.getFullYear()}-${String(numero).padStart(4, "0")}`;
}

/** Formate un numéro pour l'affichage : 7 → "F-2026-0007". */
export function formaterNumeroFacture(numero: number, date: Date): string {
  return `F-${date.getFullYear()}-${String(numero).padStart(4, "0")}`;
}
