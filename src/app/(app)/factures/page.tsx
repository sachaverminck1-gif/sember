// Liste des factures du jardinier connecté.
import Link from "next/link";
import { format, isBefore } from "date-fns";
import { fr } from "date-fns/locale";
import { getJardinierOrRedirect } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { calculerDocument, formaterEuros } from "@/lib/montants";
import { formaterNumeroFacture } from "@/lib/numerotation";

const LIBELLES_STATUT: Record<string, string> = {
  BROUILLON: "Brouillon",
  EMISE: "À encaisser",
  PAYEE: "Payée",
  ANNULEE: "Annulée",
};

const COULEURS_STATUT: Record<string, string> = {
  BROUILLON: "bg-line-subtle text-soft",
  EMISE: "bg-accent-weak text-accent",
  PAYEE: "bg-accent text-on-accent",
  ANNULEE: "bg-line-subtle text-muted line-through",
};

export default async function FacturesPage() {
  const { jardinier, lectureSeule } = await getJardinierOrRedirect();

  const factures = await prisma.facture.findMany({
    where: { jardinierId: jardinier.id },
    include: { client: { select: { nom: true } }, lignes: true },
    orderBy: { numero: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Factures
        </h1>
        {!lectureSeule && (
          <Link
            href="/factures/nouvelle"
            className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
          >
            Nouvelle facture
          </Link>
        )}
      </div>

      {factures.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="mb-5 text-soft">Aucune facture pour l&apos;instant.</p>
          {!lectureSeule && (
            <Link
              href="/factures/nouvelle"
              className="inline-block rounded-lg bg-accent px-6 py-3 font-semibold text-on-accent"
            >
              Créer ma première facture
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {factures.map((f) => {
            const totaux = calculerDocument(
              f.lignes.map((l) => ({
                quantite: Number(l.quantite),
                prixUnitaire: Number(l.prixUnitaire),
                tauxTVA: Number(l.tauxTVA),
              }))
            );
            const enRetard =
              f.statut === "EMISE" &&
              f.dateEcheance !== null &&
              isBefore(f.dateEcheance, new Date());

            return (
              <li key={f.id}>
                <Link
                  href={`/factures/${f.id}`}
                  className="card block p-4 transition hover:border-muted"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block font-medium text-foreground">
                        {f.client.nom}
                      </span>
                      <span className="block truncate text-sm text-soft">
                        {formaterNumeroFacture(f.numero, f.dateEmission)} ·{" "}
                        {format(f.dateEmission, "d MMM yyyy", { locale: fr })}
                      </span>
                      {enRetard && (
                        <span className="mt-0.5 block text-sm font-medium text-red-600">
                          En retard de paiement
                        </span>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block font-mono font-semibold text-foreground">
                        {formaterEuros(totaux.totalTTC)}
                      </span>
                      <span
                        className={`mt-1 inline-block rounded px-2 py-0.5 text-[11px] font-medium ${COULEURS_STATUT[f.statut]}`}
                      >
                        {LIBELLES_STATUT[f.statut]}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
