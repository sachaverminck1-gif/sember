// Fiche d'un devis : récapitulatif, actions (statut, PDF, conversion), édition.
import Link from "next/link";
import { notFound } from "next/navigation";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { getJardinierOrRedirect } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formaterNumeroDevis } from "@/lib/numerotation";
import { RecapDocument } from "@/components/RecapDocument";
import { ActionsDevis } from "@/components/ActionsDevis";

export default async function FicheDevisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { jardinier, lectureSeule } = await getJardinierOrRedirect();
  const { id } = await params;

  const devis = await prisma.devis.findFirst({
    where: { id, jardinierId: jardinier.id },
    include: {
      client: true,
      lignes: { orderBy: { ordre: "asc" } },
      facture: { select: { id: true } },
    },
  });
  if (!devis) notFound();

  const lignes = devis.lignes.map((l) => ({
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
          {formaterNumeroDevis(devis.numero, devis.dateDevis)}
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {devis.client.nom}
        </h1>
        {devis.objet && <p className="text-soft">{devis.objet}</p>}
        <p className="mt-1 text-sm text-muted">
          Établi le {format(devis.dateDevis, "d MMMM yyyy", { locale: fr })} · valable
          jusqu&apos;au{" "}
          {format(addDays(devis.dateDevis, devis.validiteJours), "d MMMM yyyy", {
            locale: fr,
          })}
        </p>
      </div>

      <RecapDocument lignes={lignes} assujettiTVA={jardinier.assujettiTVA} />

      {devis.notes && (
        <div className="card p-4 text-sm text-soft">{devis.notes}</div>
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
          <ActionsDevis
            devisId={devis.id}
            statut={devis.statut}
            dejaFacture={Boolean(devis.facture)}
            factureId={devis.facture?.id}
          />
          {!devis.facture && (
            <Link
              href={`/devis/${devis.id}/modifier`}
              className="block text-center text-sm font-medium text-accent underline"
            >
              Modifier ce devis
            </Link>
          )}
        </>
      )}
    </div>
  );
}
