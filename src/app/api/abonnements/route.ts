// API abonnements d'entretien : liste + souscription.
// À la création, les 12 prochaines échéances sont générées selon la fréquence.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import { abonnementSchema } from "@/lib/validation/abonnement";
import { genererDatesEcheances } from "@/lib/echeances";

export async function GET() {
  const ctx = await getJardinierForApi();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const abonnements = await prisma.abonnement.findMany({
    where: { jardinierId: ctx.jardinier.id },
    include: {
      client: { select: { nom: true } },
      formule: true,
      echeances: {
        where: { statut: "A_VENIR" },
        orderBy: { datePrevue: "asc" },
        take: 3,
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(abonnements);
}

export async function POST(request: Request) {
  const ctx = await getJardinierForApi();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (ctx.lectureSeule) {
    return NextResponse.json(
      { error: "Essai terminé : abonnez-vous pour continuer" },
      { status: 403 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = abonnementSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const donnees = parsed.data;

  // Client et formule doivent appartenir au jardinier connecté.
  const [client, formule] = await Promise.all([
    prisma.client.findFirst({
      where: { id: donnees.clientId, jardinierId: ctx.jardinier.id },
    }),
    prisma.formule.findFirst({
      where: { id: donnees.formuleId, jardinierId: ctx.jardinier.id },
    }),
  ]);
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  if (!formule) return NextResponse.json({ error: "Formule introuvable" }, { status: 404 });

  // Un seul abonnement actif par client et par formule : évite les doublons.
  const doublon = await prisma.abonnement.findFirst({
    where: {
      jardinierId: ctx.jardinier.id,
      clientId: donnees.clientId,
      formuleId: donnees.formuleId,
      statut: "ACTIF",
    },
  });
  if (doublon) {
    return NextResponse.json(
      { error: "Ce client est déjà abonné à cette formule." },
      { status: 409 }
    );
  }

  const dateDebut = donnees.dateDebut ?? new Date();
  const dates = genererDatesEcheances(dateDebut, formule.frequence);

  const abonnement = await prisma.abonnement.create({
    data: {
      jardinierId: ctx.jardinier.id,
      clientId: donnees.clientId,
      formuleId: donnees.formuleId,
      dateDebut,
      echeances: { create: dates.map((datePrevue) => ({ datePrevue })) },
    },
    include: {
      client: { select: { nom: true } },
      formule: true,
      echeances: { orderBy: { datePrevue: "asc" } },
    },
  });
  return NextResponse.json(abonnement, { status: 201 });
}
