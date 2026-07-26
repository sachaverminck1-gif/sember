// Crée une session Stripe Checkout pour souscrire un plan.
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import { getStripe, stripeActif, priceIdPourPlan } from "@/lib/stripe";

const checkoutSchema = z.object({
  plan: z.enum(["STARTER", "PRO", "BUSINESS"]),
});

export async function POST(request: Request) {
  const ctx = await getJardinierForApi();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (!stripeActif()) {
    return NextResponse.json(
      { error: "Le paiement en ligne n'est pas encore activé." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  const priceId = priceIdPourPlan(parsed.data.plan);
  if (!priceId) {
    return NextResponse.json(
      { error: "Ce plan n'est pas configuré côté paiement." },
      { status: 503 }
    );
  }

  const stripe = getStripe();
  const origine = new URL(request.url).origin;

  // Réutilise le customer Stripe existant, sinon en crée un.
  let customerId = ctx.jardinier.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: ctx.jardinier.email,
      name: ctx.jardinier.nom,
      metadata: { jardinierId: ctx.jardinier.id },
    });
    customerId = customer.id;
    await prisma.jardinier.update({
      where: { id: ctx.jardinier.id },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origine}/abonnement-saas?paiement=ok`,
    cancel_url: `${origine}/abonnement-saas?paiement=annule`,
    metadata: { jardinierId: ctx.jardinier.id, plan: parsed.data.plan },
  });

  return NextResponse.json({ url: session.url });
}
