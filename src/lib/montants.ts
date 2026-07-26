// Calcul des montants d'un document (devis ou facture).
//
// Tous les calculs se font en CENTIMES ENTIERS, jamais en flottants : additionner
// des euros en virgule flottante produit des écarts d'un centime qui rendent une
// facture fausse (et donc non conforme). On n'arrondit qu'aux frontières.

export type LigneCalculable = {
  quantite: number | string;
  prixUnitaire: number | string;
  tauxTVA: number | string;
};

export type MontantsLigne = {
  totalHT: number; // en centimes
  montantTVA: number; // en centimes
  totalTTC: number; // en centimes
};

export type MontantsDocument = {
  totalHT: number;
  montantTVA: number;
  totalTTC: number;
  /** Détail par taux de TVA, pour les mentions légales de la facture. */
  parTaux: { taux: number; baseHT: number; montantTVA: number }[];
};

/** Convertit un montant en euros (number, string ou Decimal Prisma) en centimes entiers. */
export function enCentimes(valeur: number | string): number {
  return Math.round(Number(valeur) * 100);
}

/** Formate des centimes en libellé monétaire français : 1234 → "12,34 €". */
export function formaterEuros(centimes: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(centimes / 100);
}

/** Calcule les montants d'une ligne. */
export function calculerLigne(ligne: LigneCalculable): MontantsLigne {
  const prixCentimes = enCentimes(ligne.prixUnitaire);
  const quantite = Number(ligne.quantite);
  const taux = Number(ligne.tauxTVA);

  const totalHT = Math.round(prixCentimes * quantite);
  const montantTVA = Math.round((totalHT * taux) / 100);

  return { totalHT, montantTVA, totalTTC: totalHT + montantTVA };
}

/**
 * Calcule les totaux d'un document.
 * La TVA est calculée par taux (base HT cumulée puis TVA appliquée) plutôt que
 * ligne à ligne : c'est la méthode qui évite les écarts d'arrondi sur les
 * récapitulatifs de TVA d'une facture.
 */
export function calculerDocument(lignes: LigneCalculable[]): MontantsDocument {
  const basesParTaux = new Map<number, number>();

  for (const ligne of lignes) {
    const taux = Number(ligne.tauxTVA);
    const { totalHT } = calculerLigne(ligne);
    basesParTaux.set(taux, (basesParTaux.get(taux) ?? 0) + totalHT);
  }

  const parTaux = [...basesParTaux.entries()]
    .map(([taux, baseHT]) => ({
      taux,
      baseHT,
      montantTVA: Math.round((baseHT * taux) / 100),
    }))
    .sort((a, b) => a.taux - b.taux);

  const totalHT = parTaux.reduce((s, t) => s + t.baseHT, 0);
  const montantTVA = parTaux.reduce((s, t) => s + t.montantTVA, 0);

  return { totalHT, montantTVA, totalTTC: totalHT + montantTVA, parTaux };
}
