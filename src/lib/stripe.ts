// Client Stripe + mapping des plans.
//
// Fonctionne en mode dégradé sans clés : `stripeActif()` renvoie false et la
// page d'abonnement n'affiche pas les boutons de paiement. Pour activer :
//   STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
//   STRIPE_PRICE_STARTER, STRIPE_PRICE_PRO, STRIPE_PRICE_BUSINESS (price IDs).
import Stripe from "stripe";
import type { Plan } from "@/generated/prisma/client";

let client: Stripe | null = null;

export function stripeActif(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY manquant");
  }
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

/** Price ID Stripe pour chaque plan (configurés dans le dashboard Stripe). */
export function priceIdPourPlan(plan: Plan): string | undefined {
  const mapping: Record<Plan, string | undefined> = {
    STARTER: process.env.STRIPE_PRICE_STARTER,
    PRO: process.env.STRIPE_PRICE_PRO,
    BUSINESS: process.env.STRIPE_PRICE_BUSINESS,
  };
  return mapping[plan];
}

/** Plan correspondant à un price ID Stripe (sens inverse, pour le webhook). */
export function planPourPriceId(priceId: string): Plan | undefined {
  if (priceId === process.env.STRIPE_PRICE_STARTER) return "STARTER";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "PRO";
  if (priceId === process.env.STRIPE_PRICE_BUSINESS) return "BUSINESS";
  return undefined;
}
