// API clients : liste + création. Toujours filtré par le jardinier de session.
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import { clientSchema, normaliserClient } from "@/lib/validation/client";
import { verifierQuotaClients } from "@/lib/quotas";

export async function GET() {
  const ctx = await getJardinierForApi();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const clients = await prisma.client.findMany({
    where: { jardinierId: ctx.jardinier.id },
    orderBy: { nom: "asc" },
  });
  return NextResponse.json(clients);
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

  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Quota du plan (Starter : 15 clients max — D8).
  const erreurQuota = await verifierQuotaClients(ctx.jardinier.id, ctx.jardinier.plan);
  if (erreurQuota) return NextResponse.json({ error: erreurQuota }, { status: 403 });

  const client = await prisma.client.create({
    data: { jardinierId: ctx.jardinier.id, ...normaliserClient(parsed.data) },
  });
  return NextResponse.json(client, { status: 201 });
}
