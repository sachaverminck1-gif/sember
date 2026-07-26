// Génération des échéances (passages prévus) d'un abonnement d'entretien.
import { addDays, addMonths } from "date-fns";
import type { FrequenceFormule } from "@/generated/prisma/client";

/** Nombre d'échéances générées à la création d'un abonnement. */
export const NB_ECHEANCES_GENEREES = 12;

/** Date du passage suivant selon la fréquence de la formule. */
function passageSuivant(date: Date, frequence: FrequenceFormule): Date {
  switch (frequence) {
    case "HEBDOMADAIRE":
      return addDays(date, 7);
    case "BIMENSUELLE": // 2 passages par mois
      return addDays(date, 14);
    case "MENSUELLE":
      return addMonths(date, 1);
    case "TRIMESTRIELLE":
      return addMonths(date, 3);
  }
}

/**
 * Calcule les prochaines dates de passage à partir de la date de début (incluse).
 */
export function genererDatesEcheances(
  dateDebut: Date,
  frequence: FrequenceFormule,
  nombre: number = NB_ECHEANCES_GENEREES
): Date[] {
  const dates: Date[] = [];
  let date = dateDebut;
  for (let i = 0; i < nombre; i++) {
    dates.push(date);
    date = passageSuivant(date, frequence);
  }
  return dates;
}
