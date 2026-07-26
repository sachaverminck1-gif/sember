// API formule individuelle : mise à jour + suppression (si aucun abonnement).
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import { formuleSchema } from "@/lib/validation/abonnement";

type Params = { params: Promise<{ id: string }> };

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
  const existante = await prisma.formule.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
  });
  if (!existante) {
    return NextResponse.json({ error: "Formule introuvable" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = formuleSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const formule = await prisma.formule.update({
    where: { id },
    data: {
      nom: parsed.data.nom,
      description: parsed.data.description || null,
      frequence: parsed.data.frequence,
      prixMensuel: parsed.data.prixMensuel,
    },
  });
  return NextResponse.json(formule);
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
  const formule = await prisma.formule.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
    include: { _count: { select: { abonnements: true } } },
  });
  if (!formule) {
    return NextResponse.json({ error: "Formule introuvable" }, { status: 404 });
  }

  // onDelete: Restrict côté schéma — on renvoie un message clair avant.
  if (formule._count.abonnements > 0) {
    return NextResponse.json(
      { error: "Impossible de supprimer : des clients sont abonnés à cette formule." },
      { status: 409 }
    );
  }

  await prisma.formule.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
