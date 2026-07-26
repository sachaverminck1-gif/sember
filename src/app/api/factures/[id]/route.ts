// API facture individuelle.
//
// Règle de conformité : une facture ÉMISE est figée. On ne la modifie plus et
// on ne la supprime pas (cela créerait un trou dans la séquence) — on peut
// seulement la marquer payée ou l'annuler. Seul un brouillon reste modifiable.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import { factureSchema, statutFactureSchema } from "@/lib/validation/document";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const ctx = await getJardinierForApi();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const facture = await prisma.facture.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
    include: { client: true, lignes: { orderBy: { ordre: "asc" } }, devis: true },
  });
  if (!facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }
  return NextResponse.json(facture);
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
  const existante = await prisma.facture.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
  });
  if (!existante) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  // Changement de statut : toujours autorisé (émettre, encaisser, annuler).
  const changementStatut = statutFactureSchema.safeParse(body);
  if (changementStatut.success) {
    const facture = await prisma.facture.update({
      where: { id },
      data: { statut: changementStatut.data.statut },
      include: { lignes: true },
    });
    return NextResponse.json(facture);
  }

  // Modification du contenu : réservée aux brouillons.
  if (existante.statut !== "BROUILLON") {
    return NextResponse.json(
      {
        error:
          "Une facture émise ne peut plus être modifiée. Annulez-la et créez-en une nouvelle.",
      },
      { status: 409 }
    );
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

  const facture = await prisma.$transaction(async (tx) => {
    await tx.ligneFacture.deleteMany({ where: { factureId: id } });
    return tx.facture.update({
      where: { id },
      data: {
        clientId: donnees.clientId,
        objet: donnees.objet || null,
        dateEmission: donnees.dateEmission ?? existante.dateEmission,
        dateEcheance: donnees.dateEcheance ?? existante.dateEcheance,
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

  return NextResponse.json(facture);
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
  const facture = await prisma.facture.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
  });
  if (!facture) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }

  // Séquence de numérotation continue : on ne supprime pas une facture émise.
  if (facture.statut !== "BROUILLON") {
    return NextResponse.json(
      {
        error:
          "Une facture émise ne peut pas être supprimée. Utilisez « Annuler » pour la neutraliser.",
      },
      { status: 409 }
    );
  }

  await prisma.facture.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
