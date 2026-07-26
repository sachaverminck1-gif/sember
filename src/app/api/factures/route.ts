// API factures : liste + création directe (sans devis préalable).
import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import { factureSchema } from "@/lib/validation/document";
import { avecNumeroSequentiel } from "@/lib/numerotation";

const DELAI_PAIEMENT_JOURS = 30;

export async function GET() {
  const ctx = await getJardinierForApi();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const factures = await prisma.facture.findMany({
    where: { jardinierId: ctx.jardinier.id },
    include: { client: { select: { nom: true } }, lignes: true },
    orderBy: { numero: "desc" },
  });
  return NextResponse.json(factures);
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

  const parsed = factureSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const donnees = parsed.data;

  const client = await prisma.client.findFirst({
    where: { id: donnees.clientId, jardinierId: ctx.jardinier.id },
  });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const tauxEffectif = (taux: number) => (ctx.jardinier.assujettiTVA ? taux : 0);
  const dateEmission = donnees.dateEmission ?? new Date();

  const facture = await avecNumeroSequentiel(
    async () => {
      const dernier = await prisma.facture.aggregate({
        where: { jardinierId: ctx.jardinier.id },
        _max: { numero: true },
      });
      return (dernier._max.numero ?? 0) + 1;
    },
    (numero) =>
      prisma.facture.create({
        data: {
          jardinierId: ctx.jardinier.id,
          clientId: donnees.clientId,
          numero,
          objet: donnees.objet || null,
          dateEmission,
          dateEcheance: donnees.dateEcheance ?? addDays(dateEmission, DELAI_PAIEMENT_JOURS),
          notes: donnees.notes || null,
          lignes: {
            create: donnees.lignes.map((l, index) => ({
              designation: l.designation,
              quantite: l.quantite,
              prixUnitaire: l.prixUnitaire,
              tauxTVA: tauxEffectif(l.tauxTVA),
              ordre: index,
            })),
          },
        },
        include: { lignes: true },
      })
  );

  return NextResponse.json(facture, { status: 201 });
}
