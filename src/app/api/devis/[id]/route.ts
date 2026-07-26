// API devis individuel : lecture, mise à jour, changement de statut, suppression.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import { devisSchema, statutDevisSchema } from "@/lib/validation/document";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const ctx = await getJardinierForApi();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const devis = await prisma.devis.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
    include: { client: true, lignes: { orderBy: { ordre: "asc" } }, facture: true },
  });
  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  return NextResponse.json(devis);
}

export async function PUT(request: Request, { params }: Params) {
  const ctx = await getJardinierForApi();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (ctx.lectureSeule) {
    return NextResponse.json(
      { error: "Essai terminé : abonnez-vous pour continuer" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const existant = await prisma.devis.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
  });
  if (!existant) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  // Deux usages : changer seulement le statut, ou modifier le devis entier.
  const changementStatut = statutDevisSchema.safeParse(body);
  if (changementStatut.success) {
    const devis = await prisma.devis.update({
      where: { id },
      data: { statut: changementStatut.data.statut },
      include: { lignes: true },
    });
    return NextResponse.json(devis);
  }

  const parsed = devisSchema.safeParse(body);
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

  // Les lignes sont remplacées en bloc : plus simple et plus sûr que de
  // réconcilier ligne à ligne, et le volume est faible.
  const devis = await prisma.$transaction(async (tx) => {
    await tx.ligneDevis.deleteMany({ where: { devisId: id } });
    return tx.devis.update({
      where: { id },
      data: {
        clientId: donnees.clientId,
        objet: donnees.objet || null,
        dateDevis: donnees.dateDevis ?? existant.dateDevis,
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
    });
  });

  return NextResponse.json(devis);
}

export async function DELETE(_request: Request, { params }: Params) {
  const ctx = await getJardinierForApi();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (ctx.lectureSeule) {
    return NextResponse.json(
      { error: "Essai terminé : abonnez-vous pour continuer" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const devis = await prisma.devis.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
    include: { facture: true },
  });
  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

  if (devis.facture) {
    return NextResponse.json(
      { error: "Impossible de supprimer : ce devis a déjà été facturé." },
      { status: 409 }
    );
  }

  await prisma.devis.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
