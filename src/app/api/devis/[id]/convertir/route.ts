// Conversion d'un devis en facture : report des lignes à l'identique.
// Le lien devis ↔ facture est conservé (relation 1-1) pour la traçabilité.
import { NextResponse } from "next/server";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import { avecNumeroSequentiel } from "@/lib/numerotation";

type Params = { params: Promise<{ id: string }> };

/** Délai de paiement par défaut appliqué aux factures générées. */
const DELAI_PAIEMENT_JOURS = 30;

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
  const devis = await prisma.devis.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
    include: { lignes: { orderBy: { ordre: "asc" } }, facture: true },
  });
  if (!devis) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });

  if (devis.facture) {
    return NextResponse.json(
      { error: "Ce devis a déjà été converti en facture.", factureId: devis.facture.id },
      { status: 409 }
    );
  }

  const maintenant = new Date();

  const facture = await avecNumeroSequentiel(
    async () => {
      const dernier = await prisma.facture.aggregate({
        where: { jardinierId: ctx.jardinier.id },
        _max: { numero: true },
      });
      return (dernier._max.numero ?? 0) + 1;
    },
    (numero) =>
      prisma.facture.create({
        data: {
          jardinierId: ctx.jardinier.id,
          clientId: devis.clientId,
          devisId: devis.id,
          numero,
          objet: devis.objet,
          dateEmission: maintenant,
          dateEcheance: addDays(maintenant, DELAI_PAIEMENT_JOURS),
          notes: devis.notes,
          lignes: {
            create: devis.lignes.map((l) => ({
              designation: l.designation,
              quantite: l.quantite,
              prixUnitaire: l.prixUnitaire,
              tauxTVA: l.tauxTVA,
              ordre: l.ordre,
            })),
          },
        },
        include: { lignes: true },
      })
  );

  // Un devis converti est de fait accepté.
  if (devis.statut !== "ACCEPTE") {
    await prisma.devis.update({ where: { id }, data: { statut: "ACCEPTE" } });
  }

  return NextResponse.json(facture, { status: 201 });
}
