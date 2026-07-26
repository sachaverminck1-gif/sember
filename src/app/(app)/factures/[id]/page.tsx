// Fiche d'une facture : récapitulatif, actions, lien vers le devis d'origine.
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getJardinierOrRedirect } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formaterNumeroFacture, formaterNumeroDevis } from "@/lib/numerotation";
import { RecapDocument } from "@/components/RecapDocument";
import { ActionsFacture } from "@/components/ActionsFacture";

export default async function FicheFacturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { jardinier, lectureSeule } = await getJardinierOrRedirect();
  const { id } = await params;

  const facture = await prisma.facture.findFirst({
    where: { id, jardinierId: jardinier.id },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
      devis: { select: { id: true, numero: true, dateDevis: true } },
    },
  });
  if (!facture) notFound();

  const lignes = facture.lignes.map((l) => ({
    id: l.id,
    designation: l.designation,
    quantite: Number(l.quantite),
    prixUnitaire: Number(l.prixUnitaire),
    tauxTVA: Number(l.tauxTVA),
  }));

  return (
    <div className="space-y-6">
      <div>
        <span className="font-mono text-sm text-muted">
          {formaterNumeroFacture(facture.numero, facture.dateEmission)}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {facture.client.nom}
        </h1>
        {facture.objet && <p className="text-soft">{facture.objet}</p>}
        <p className="mt-1 text-sm text-muted">
          Émise le {format(facture.dateEmission, "d MMMM yyyy", { locale: fr })}
          {facture.dateEcheance &&
            ` · à régler avant le ${format(facture.dateEcheance, "d MMMM yyyy", { locale: fr })}`}
        </p>
        {facture.devis && (
          <Link
            href={`/devis/${facture.devis.id}`}
            className="mt-1 inline-block text-sm text-accent underline"
          >
            Issue du devis {formaterNumeroDevis(facture.devis.numero, facture.devis.dateDevis)}
          </Link>
        )}
      </div>

      <RecapDocument lignes={lignes} assujettiTVA={jardinier.assujettiTVA} />

      {facture.notes && (
        <div className="card p-4 text-sm text-soft">{facture.notes}</div>
      )}

      {lectureSeule ? (
        <div className="card p-4 text-center text-sm text-soft">
          Essai terminé — consultation seule.{" "}
          <Link href="/abonnement-saas" className="font-semibold text-accent underline">
            Voir les formules
          </Link>
        </div>
      ) : (
        <>
          <ActionsFacture factureId={facture.id} statut={facture.statut} />
          {facture.statut === "BROUILLON" && (
            <Link
              href={`/factures/${facture.id}/modifier`}
              className="block text-center text-sm font-medium text-accent underline"
            >
              Modifier ce brouillon
            </Link>
          )}
        </>
      )}
    </div>
  );
}
