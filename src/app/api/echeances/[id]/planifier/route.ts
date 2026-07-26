// Transforme une échéance d'abonnement en intervention au planning.
// Lien 1-1 : une échéance ne peut être planifiée qu'une fois.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const ctx = await getJardinierForApi();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (ctx.lectureSeule) {
    return NextResponse.json(
      { error: "Essai terminé : abonnez-vous pour continuer" },
      { status: 403 }
    );
  }

  const { id } = await params;
  // L'échéance doit appartenir à un abonnement du jardinier connecté.
  const echeance = await prisma.echeance.findFirst({
    where: { id, abonnement: { jardinierId: ctx.jardinier.id } },
    include: {
      abonnement: { include: { client: true, formule: true } },
      intervention: true,
    },
  });
  if (!echeance) {
    return NextResponse.json({ error: "Échéance introuvable" }, { status: 404 });
  }
  if (echeance.intervention) {
    return NextResponse.json(
      { error: "Cette échéance est déjà planifiée.", interventionId: echeance.intervention.id },
      { status: 409 }
    );
  }

  const intervention = await prisma.intervention.create({
    data: {
      jardinierId: ctx.jardinier.id,
      clientId: echeance.abonnement.clientId,
      titre: echeance.abonnement.formule.nom,
      date: echeance.datePrevue,
      dureeMinutes: 120,
      echeanceId: echeance.id,
    },
    include: { client: { select: { nom: true } } },
  });

  return NextResponse.json(intervention, { status: 201 });
}
