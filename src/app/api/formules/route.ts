// API formules d'entretien : liste + création.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import { formuleSchema } from "@/lib/validation/abonnement";

export async function GET() {
  const ctx = await getJardinierForApi();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const formules = await prisma.formule.findMany({
    where: { jardinierId: ctx.jardinier.id },
    include: { _count: { select: { abonnements: { where: { statut: "ACTIF" } } } } },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(formules);
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

  const parsed = formuleSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const formule = await prisma.formule.create({
    data: {
      jardinierId: ctx.jardinier.id,
      nom: parsed.data.nom,
      description: parsed.data.description || null,
      frequence: parsed.data.frequence,
      prixMensuel: parsed.data.prixMensuel,
    },
  });
  return NextResponse.json(formule, { status: 201 });
}
