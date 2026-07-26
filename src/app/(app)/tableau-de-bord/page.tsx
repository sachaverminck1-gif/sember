// Tableau de bord : vue d'ensemble de l'activité du jardinier connecté.
// Toutes les requêtes sont filtrées par jardinierId (isolation multi-tenant).
import Link from "next/link";
import { startOfDay, endOfDay, addDays, format } from "date-fns";
import { fr } from "date-fns/locale";
import { getJardinierOrRedirect } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export default async function TableauDeBordPage() {
  const { jardinier } = await getJardinierOrRedirect();

  const maintenant = new Date();
  const [nbClients, nbDevisEnCours, nbFacturesImpayees, interventionsAVenir] =
    await Promise.all([
      prisma.client.count({ where: { jardinierId: jardinier.id } }),
      prisma.devis.count({
        where: { jardinierId: jardinier.id, statut: { in: ["BROUILLON", "ENVOYE"] } },
      }),
      prisma.facture.count({
        where: { jardinierId: jardinier.id, statut: "EMISE" },
      }),
      prisma.intervention.findMany({
        where: {
          jardinierId: jardinier.id,
          statut: "PLANIFIEE",
          date: { gte: startOfDay(maintenant), lte: endOfDay(addDays(maintenant, 7)) },
        },
        include: { client: true },
        orderBy: { date: "asc" },
        take: 5,
      }),
    ]);

  const tuiles = [
    { label: "Clients", valeur: nbClients, href: "/clients" },
    { label: "Devis en cours", valeur: nbDevisEnCours, href: "/devis" },
    { label: "À encaisser", valeur: nbFacturesImpayees, href: "/factures" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Bonjour {jardinier.nom.split(" ")[0]}
      </h1>

      {/* Tuiles de synthèse */}
      <div className="grid grid-cols-3 gap-3">
        {tuiles.map((t) => (
          <Link key={t.href} href={t.href} className="card p-4 text-center transition hover:border-muted">
            <span className="block font-mono text-3xl font-semibold text-foreground">
              {t.valeur}
            </span>
            <span className="mt-1 block text-xs text-soft">{t.label}</span>
          </Link>
        ))}
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/devis/nouveau"
          className="rounded-lg bg-accent px-4 py-4 text-center text-base font-semibold text-on-accent transition hover:bg-accent-hover"
        >
          Nouveau devis
        </Link>
        <Link
          href="/clients/nouveau"
          className="rounded-lg border border-line bg-surface px-4 py-4 text-center text-base font-semibold text-foreground transition hover:border-muted"
        >
          Nouveau client
        </Link>
      </div>

      {/* Prochaines interventions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Cette semaine ({interventionsAVenir.length})
        </h2>
        {interventionsAVenir.length === 0 ? (
          <p className="card p-4 text-soft">
            Aucune intervention planifiée.{" "}
            <Link href="/planning" className="font-medium text-accent underline">
              Ouvrir le planning
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {interventionsAVenir.map((i) => (
              <li key={i.id} className="card p-4">
                <span className="block font-medium text-foreground">{i.titre}</span>
                <span className="block text-sm text-soft">
                  {i.client.nom} —{" "}
                  {format(i.date, "EEEE d MMMM 'à' HH'h'mm", { locale: fr })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
