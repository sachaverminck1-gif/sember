// Inscription d'un jardinier : crée le compte avec 7 jours d'essai (D9).
import { NextResponse } from "next/server";
import argon2 from "argon2";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { inscriptionSchema } from "@/lib/validation/jardinier";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
  }

  const parsed = inscriptionSchema.safeParse(body);
  if (!parsed.success) {
    // On renvoie le premier message d'erreur lisible pour l'utilisateur.
    const message = parsed.error.issues[0]?.message ?? "Données invalides";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { nom, email, password, entreprise, telephone, assujettiTVA } = parsed.data;

  const existe = await prisma.jardinier.findUnique({ where: { email } });
  if (existe) {
    return NextResponse.json(
      { error: "Un compte existe déjà avec cet email" },
      { status: 409 }
    );
  }

  const passwordHash = await argon2.hash(password);

  await prisma.jardinier.create({
    data: {
      nom,
      email,
      passwordHash,
      entreprise: entreprise || null,
      telephone: telephone || null,
      assujettiTVA,
      trialEndsAt: addDays(new Date(), 7), // essai 7 jours, sans CB (D9)
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
