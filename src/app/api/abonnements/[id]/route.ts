// API abonnement individuel : changement de statut (suspendre / reprendre / résilier).
// La résiliation supprime les échéances à venir mais conserve l'historique.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import { statutAbonnementSchema } from "@/lib/validation/abonnement";

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
  const existant = await prisma.abonnement.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
  });
  if (!existant) {
    return NextResponse.json({ error: "Abonnement introuvable" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = statutAbonnementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const abonnement = await prisma.$transaction(async (tx) => {
    if (parsed.data.statut === "RESILIE") {
      // On efface le futur, on garde le passé (passages effectués/manqués).
      await tx.echeance.deleteMany({
        where: { abonnementId: id, statut: "A_VENIR" },
      });
    }
    return tx.abonnement.update({
      where: { id },
      data: { statut: parsed.data.statut },
      include: { client: { select: { nom: true } }, formule: true },
    });
  });

  return NextResponse.json(abonnement);
}
