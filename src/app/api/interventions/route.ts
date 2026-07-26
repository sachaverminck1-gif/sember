// API interventions : liste (filtrable par mois) + création.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import { interventionSchema } from "@/lib/validation/intervention";

export async function GET(request: Request) {
  const ctx = await getJardinierForApi();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  // Filtre optionnel ?debut=ISO&fin=ISO pour ne charger qu'une plage.
  const { searchParams } = new URL(request.url);
  const debut = searchParams.get("debut");
  const fin = searchParams.get("fin");

  const interventions = await prisma.intervention.findMany({
    where: {
      jardinierId: ctx.jardinier.id,
      ...(debut && fin
        ? { date: { gte: new Date(debut), lte: new Date(fin) } }
        : {}),
    },
    include: { client: { select: { nom: true } } },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(interventions);
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

  const intervention = await prisma.intervention.create({
    data: {
      jardinierId: ctx.jardinier.id,
      clientId: donnees.clientId,
      titre: donnees.titre,
      date: donnees.date,
      dureeMinutes: donnees.dureeMinutes,
      notes: donnees.notes || null,
    },
    include: { client: { select: { nom: true } } },
  });
  return NextResponse.json(intervention, { status: 201 });
}
