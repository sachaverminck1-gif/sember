// API devis : liste + création.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import { devisSchema } from "@/lib/validation/document";
import { avecNumeroSequentiel } from "@/lib/numerotation";

export async function GET() {
  const ctx = await getJardinierForApi();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const devis = await prisma.devis.findMany({
    where: { jardinierId: ctx.jardinier.id },
    include: { client: { select: { nom: true } }, lignes: true },
    orderBy: { numero: "desc" },
  });
  return NextResponse.json(devis);
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

  const parsed = devisSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const donnees = parsed.data;

  // Le client doit appartenir au jardinier connecté.
  const client = await prisma.client.findFirst({
    where: { id: donnees.clientId, jardinierId: ctx.jardinier.id },
  });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  // Franchise de TVA : on force le taux à 0 quel que soit l'envoi (D2).
  const tauxEffectif = (taux: number) => (ctx.jardinier.assujettiTVA ? taux : 0);

  const devis = await avecNumeroSequentiel(
    async () => {
      const dernier = await prisma.devis.aggregate({
        where: { jardinierId: ctx.jardinier.id },
        _max: { numero: true },
      });
      return (dernier._max.numero ?? 0) + 1;
    },
    (numero) =>
      prisma.devis.create({
        data: {
          jardinierId: ctx.jardinier.id,
          clientId: donnees.clientId,
          numero,
          objet: donnees.objet || null,
          dateDevis: donnees.dateDevis ?? new Date(),
          validiteJours: donnees.validiteJours,
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

  return NextResponse.json(devis, { status: 201 });
}
