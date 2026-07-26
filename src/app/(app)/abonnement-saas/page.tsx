// Page "Mon abonnement" : état de l'essai + présentation des 3 plans (D7/D8).
// Le paiement Stripe (checkout) est branché à l'étape 7 — pour l'instant la
// page présente les plans et l'état réel du compte, sans bouton de paiement.
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getJardinierOrRedirect } from "@/lib/session";
import { stripeActif } from "@/lib/stripe";
import { BoutonSouscrirePlan } from "@/components/BoutonSouscrirePlan";

const PLANS = [
  {
    code: "STARTER",
    nom: "Starter",
    prix: "19",
    points: [
      "Jusqu'à 15 clients",
      "Devis et factures illimités",
      "Planning",
      "Abonnements d'entretien",
    ],
  },
  {
    code: "PRO",
    nom: "Pro",
    prix: "49",
    points: [
      "Clients illimités",
      "Relances et rappels",
      "Export comptable",
      "Tout Starter inclus",
    ],
  },
  {
    code: "BUSINESS",
    nom: "Business",
    prix: "99",
    points: ["Multi-employés", "Statistiques d'activité", "Tout Pro inclus"],
  },
];

const LIBELLES_STATUT: Record<string, string> = {
  TRIAL: "Essai gratuit en cours",
  ACTIVE: "Abonnement actif",
  PAST_DUE: "Paiement en attente",
  LOCKED: "Essai terminé — abonnement requis",
  CANCELED: "Abonnement résilié",
};

export default async function AbonnementSaasPage() {
  const { jardinier } = await getJardinierOrRedirect();
  const paiementActif = stripeActif();
  const abonne = jardinier.subscriptionStatus === "ACTIVE";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Mon abonnement
      </h1>

      <div className="card p-4">
        <p className="font-medium text-foreground">
          {LIBELLES_STATUT[jardinier.subscriptionStatus] ?? jardinier.subscriptionStatus}
        </p>
        {jardinier.subscriptionStatus === "TRIAL" && (
          <p className="text-sm text-soft">
            Fin de l&apos;essai le{" "}
            {format(jardinier.trialEndsAt, "d MMMM yyyy", { locale: fr })}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {PLANS.map((plan) => {
          const actuel = jardinier.plan === plan.code;
          return (
            <div
              key={plan.code}
              className={`card p-5 ${actuel ? "border-accent" : ""}`}
            >
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-lg font-semibold text-foreground">{plan.nom}</span>
                <span className="font-mono text-2xl font-semibold text-foreground">
                  {plan.prix} €
                  <span className="text-sm font-normal text-muted"> /mois</span>
                </span>
              </div>
              <ul className="space-y-1 text-sm text-soft">
                {plan.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              {paiementActif ? (
                <BoutonSouscrirePlan
                  plan={plan.code as "STARTER" | "PRO" | "BUSINESS"}
                  actuel={abonne && actuel}
                />
              ) : (
                actuel && (
                  <p className="mt-3 text-sm font-semibold text-accent">Votre formule</p>
                )
              )}
            </div>
          );
        })}
      </div>

      {!paiementActif && (
        <p className="text-center text-sm text-muted">
          Le paiement en ligne arrive très bientôt. Vos données sont conservées.
        </p>
      )}
    </div>
  );
}
