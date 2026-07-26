// API intervention individuelle : lecture, mise à jour (contenu ou statut), suppression.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import {
  interventionSchema,
  statutInterventionSchema,
} from "@/lib/validation/intervention";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const ctx = await getJardinierForApi();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const intervention = await prisma.intervention.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
    include: { client: { select: { nom: true } } },
  });
  if (!intervention) {
    return NextResponse.json({ error: "Intervention introuvable" }, { status: 404 });
  }
  return NextResponse.json(intervention);
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
  const existante = await prisma.intervention.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
  });
  if (!existante) {
    return NextResponse.json({ error: "Intervention introuvable" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  // Changement de statut seul (terminer / annuler depuis le planning).
  const changementStatut = statutInterventionSchema.safeParse(body);
  if (changementStatut.success) {
    const intervention = await prisma.intervention.update({
      where: { id },
      data: { statut: changementStatut.data.statut },
      include: { client: { select: { nom: true } } },
    });

    // Si l'intervention vient d'une échéance d'abonnement, on synchronise son statut.
    if (existante.echeanceId) {
      const statutEcheance =
        changementStatut.data.statut === "TERMINEE"
          ? "EFFECTUEE"
          : changementStatut.data.statut === "ANNULEE"
            ? "MANQUEE"
            : "A_VENIR";
      await prisma.echeance.update({
        where: { id: existante.echeanceId },
        data: { statut: statutEcheance },
      });
    }

    return NextResponse.json(intervention);
  }

  const parsed = interventionSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  const donnees = parsed.data;

  const client = await prisma.client.findFirst({
    where: { id: donnees.clientId, jardinierId: ctx.jardinier.id },
  });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  const intervention = await prisma.intervention.update({
    where: { id },
    data: {
      clientId: donnees.clientId,
      titre: donnees.titre,
      date: donnees.date,
      dureeMinutes: donnees.dureeMinutes,
      notes: donnees.notes || null,
    },
    include: { client: { select: { nom: true } } },
  });
  return NextResponse.json(intervention);
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
  const existante = await prisma.intervention.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
  });
  if (!existante) {
    return NextResponse.json({ error: "Intervention introuvable" }, { status: 404 });
  }

  await prisma.intervention.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
