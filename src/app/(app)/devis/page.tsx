// Liste des devis du jardinier connecté.
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getJardinierOrRedirect } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { calculerDocument, formaterEuros } from "@/lib/montants";
import { formaterNumeroDevis } from "@/lib/numerotation";

const LIBELLES_STATUT: Record<string, string> = {
  BROUILLON: "Brouillon",
  ENVOYE: "Envoyé",
  ACCEPTE: "Accepté",
  REFUSE: "Refusé",
};

const COULEURS_STATUT: Record<string, string> = {
  BROUILLON: "bg-line-subtle text-soft",
  ENVOYE: "bg-accent-weak text-accent",
  ACCEPTE: "bg-accent text-on-accent",
  REFUSE: "bg-red-50 text-red-700",
};

export default async function DevisPage() {
  const { jardinier, lectureSeule } = await getJardinierOrRedirect();

  const devis = await prisma.devis.findMany({
    where: { jardinierId: jardinier.id },
    include: { client: { select: { nom: true } }, lignes: true },
    orderBy: { numero: "desc" },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Devis</h1>
        {!lectureSeule && (
          <Link
            href="/devis/nouveau"
            className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
          >
            Nouveau devis
          </Link>
        )}
      </div>

      {devis.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="mb-5 text-soft">Aucun devis pour l&apos;instant.</p>
          {!lectureSeule && (
            <Link
              href="/devis/nouveau"
              className="inline-block rounded-lg bg-accent px-6 py-3 font-semibold text-on-accent"
            >
              Créer mon premier devis
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {devis.map((d) => {
            const totaux = calculerDocument(
              d.lignes.map((l) => ({
                quantite: Number(l.quantite),
                prixUnitaire: Number(l.prixUnitaire),
                tauxTVA: Number(l.tauxTVA),
              }))
            );
            return (
              <li key={d.id}>
                <Link href={`/devis/${d.id}`} className="card block p-4 transition hover:border-muted">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block font-medium text-foreground">
                        {d.client.nom}
                      </span>
                      <span className="block truncate text-sm text-soft">
                        {formaterNumeroDevis(d.numero, d.dateDevis)} ·{" "}
                        {format(d.dateDevis, "d MMM yyyy", { locale: fr })}
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block font-mono font-semibold text-foreground">
                        {formaterEuros(totaux.totalTTC)}
                      </span>
                      <span
                        className={`mt-1 inline-block rounded px-2 py-0.5 text-[11px] font-medium ${COULEURS_STATUT[d.statut]}`}
                      >
                        {LIBELLES_STATUT[d.statut]}
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
