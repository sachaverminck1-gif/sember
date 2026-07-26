// API client individuel : lecture, mise à jour, suppression.
// L'accès vérifie TOUJOURS que le client appartient au jardinier de session.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import { clientSchema, normaliserClient } from "@/lib/validation/client";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const ctx = await getJardinierForApi();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const client = await prisma.client.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
  });
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  return NextResponse.json(client);
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
  const existe = await prisma.client.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
  });
  if (!existe) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const client = await prisma.client.update({
    where: { id },
    data: normaliserClient(parsed.data),
  });
  return NextResponse.json(client);
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
  const existe = await prisma.client.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
  });
  if (!existe) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });

  // Un client avec devis ou factures ne peut pas être supprimé (onDelete: Restrict) :
  // on renvoie un message clair plutôt qu'une erreur technique.
  const [nbDevis, nbFactures] = await Promise.all([
    prisma.devis.count({ where: { clientId: id } }),
    prisma.facture.count({ where: { clientId: id } }),
  ]);
  if (nbDevis > 0 || nbFactures > 0) {
    return NextResponse.json(
      { error: "Impossible de supprimer : ce client a des devis ou des factures." },
      { status: 409 }
    );
  }

  await prisma.client.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
