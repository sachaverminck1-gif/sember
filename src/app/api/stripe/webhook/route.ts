// Webhook Stripe : synchronise l'état d'abonnement du jardinier.
// Événements gérés : checkout terminé, paiement échoué, résiliation.
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { getStripe, stripeActif, planPourPriceId } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!stripeActif() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  const corps = await request.text();
  const stripe = getStripe();

  let evenement: Stripe.Event;
  try {
    evenement = stripe.webhooks.constructEvent(
      corps,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  switch (evenement.type) {
    // Paiement initial réussi → abonnement actif.
    case "checkout.session.completed": {
      const session = evenement.data.object;
      const jardinierId = session.metadata?.jardinierId;
      const plan = session.metadata?.plan;
      if (jardinierId && (plan === "STARTER" || plan === "PRO" || plan === "BUSINESS")) {
        await prisma.jardinier.update({
          where: { id: jardinierId },
          data: {
            plan,
            subscriptionStatus: "ACTIVE",
            stripeSubId:
              typeof session.subscription === "string" ? session.subscription : null,
          },
        });
      }
      break;
    }

    // Changement de plan ou renouvellement : on resynchronise depuis le price.
    case "customer.subscription.updated": {
      const abonnement = evenement.data.object;
      const jardinier = await prisma.jardinier.findFirst({
        where: { stripeSubId: abonnement.id },
      });
      if (jardinier) {
        const priceId = abonnement.items.data[0]?.price.id;
        const plan = priceId ? planPourPriceId(priceId) : undefined;
        await prisma.jardinier.update({
          where: { id: jardinier.id },
          data: {
            ...(plan ? { plan } : {}),
            subscriptionStatus:
              abonnement.status === "active"
                ? "ACTIVE"
                : abonnement.status === "past_due"
                  ? "PAST_DUE"
                  : jardinier.subscriptionStatus,
          },
        });
      }
      break;
    }

    // Échec de paiement récurrent.
    case "invoice.payment_failed": {
      const facture = evenement.data.object;
      const customerId =
        typeof facture.customer === "string" ? facture.customer : null;
      if (customerId) {
        await prisma.jardinier.updateMany({
          where: { stripeCustomerId: customerId },
          data: { subscriptionStatus: "PAST_DUE" },
        });
      }
      break;
    }

    // Résiliation : retour en lecture seule.
    case "customer.subscription.deleted": {
      const abonnement = evenement.data.object;
      await prisma.jardinier.updateMany({
        where: { stripeSubId: abonnement.id },
        data: { subscriptionStatus: "CANCELED", stripeSubId: null },
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
