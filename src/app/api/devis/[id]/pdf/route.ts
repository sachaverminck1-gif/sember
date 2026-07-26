// Génération du PDF d'un devis.
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { getJardinierForApi } from "@/lib/session";
import { DocumentPDF } from "@/lib/pdf/DocumentPDF";
import { formaterNumeroDevis } from "@/lib/numerotation";
import { addDays } from "date-fns";

// @react-pdf/renderer nécessite le runtime Node (pas Edge).
export const runtime = "nodejs";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const ctx = await getJardinierForApi();
  if (!ctx) return new Response("Non authentifié", { status: 401 });

  const { id } = await params;
  const devis = await prisma.devis.findFirst({
    where: { id, jardinierId: ctx.jardinier.id },
    include: { client: true, lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!devis) return new Response("Devis introuvable", { status: 404 });

  const numero = formaterNumeroDevis(devis.numero, devis.dateDevis);

  const buffer = await renderToBuffer(
    DocumentPDF({
      donnees: {
        type: "DEVIS",
        numero,
        date: devis.dateDevis,
        dateLimite: addDays(devis.dateDevis, devis.validiteJours),
        objet: devis.objet,
        notes: devis.notes,
        emetteur: {
          nom: ctx.jardinier.nom,
          entreprise: ctx.jardinier.entreprise,
          telephone: ctx.jardinier.telephone,
          email: ctx.jardinier.email,
          siret: ctx.jardinier.siret,
          assujettiTVA: ctx.jardinier.assujettiTVA,
        },
        destinataire: {
          nom: devis.client.nom,
          adresse: devis.client.adresse,
          codePostal: devis.client.codePostal,
          ville: devis.client.ville,
        },
        lignes: devis.lignes.map((l) => ({
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
