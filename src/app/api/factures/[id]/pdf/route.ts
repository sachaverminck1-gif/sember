// Génération du PDF d'une facture.
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import { DocumentPDF } from "@/lib/pdf/DocumentPDF";
import { formaterNumeroFacture } from "@/lib/numerotation";

export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const ctx = await getJardinierForApi();
  if (!ctx) return new Response("Non authentifié", { status: 401 });

  const { id } = await params;
  const facture = await prisma.facture.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
    include: { client: true, lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!facture) return new Response("Facture introuvable", { status: 404 });

  const numero = formaterNumeroFacture(facture.numero, facture.dateEmission);

  const buffer = await renderToBuffer(
    DocumentPDF({
      donnees: {
        type: "FACTURE",
        numero,
        date: facture.dateEmission,
        dateLimite: facture.dateEcheance,
        objet: facture.objet,
        notes: facture.notes,
        emetteur: {
          nom: ctx.jardinier.nom,
          entreprise: ctx.jardinier.entreprise,
          telephone: ctx.jardinier.telephone,
          email: ctx.jardinier.email,
          siret: ctx.jardinier.siret,
          assujettiTVA: ctx.jardinier.assujettiTVA,
        },
        destinataire: {
          nom: facture.client.nom,
          adresse: facture.client.adresse,
          codePostal: facture.client.codePostal,
          ville: facture.client.ville,
        },
        lignes: facture.lignes.map((l) => ({
          designation: l.designation,
          quantite: Number(l.quantite),
          prixUnitaire: Number(l.prixUnitaire),
          tauxTVA: Number(l.tauxTVA),
        })),
      },
    })
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${numero}.pdf"`,
    },
  });
}
