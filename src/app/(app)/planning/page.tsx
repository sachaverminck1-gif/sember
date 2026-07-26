// Planning : vue mensuelle mobile-first.
// Grille du mois (pastilles sur les jours chargés) + liste chronologique des
// interventions du mois. Navigation par mois via ?mois=YYYY-MM.
import Link from "next/link";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  addMonths,
  parse,
  isValid,
} from "date-fns";
import { fr } from "date-fns/locale";
import { getJardinierOrRedirect } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { ActionsIntervention } from "@/components/ActionsIntervention";

const LIBELLES_STATUT: Record<string, string> = {
  PLANIFIEE: "Planifiée",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  const { jardinier, lectureSeule } = await getJardinierOrRedirect();
  const { mois } = await searchParams;

  // Mois affiché : ?mois=YYYY-MM, sinon le mois courant.
  const moisParse = mois ? parse(mois, "yyyy-MM", new Date()) : new Date();
  const reference = isValid(moisParse) ? moisParse : new Date();

  const debutMois = startOfMonth(reference);
  const finMois = endOfMonth(reference);

  const interventions = await prisma.intervention.findMany({
    where: {
      jardinierId: jardinier.id,
      date: { gte: debutMois, lte: finMois },
    },
    include: { client: { select: { nom: true } } },
    orderBy: { date: "asc" },
  });

  // Grille calendaire : semaines complètes (lundi → dimanche).
  const jours = eachDayOfInterval({
    start: startOfWeek(debutMois, { weekStartsOn: 1 }),
    end: endOfWeek(finMois, { weekStartsOn: 1 }),
  });

  const moisPrecedent = format(addMonths(reference, -1), "yyyy-MM");
  const moisSuivant = format(addMonths(reference, 1), "yyyy-MM");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Planning
        </h1>
        {!lectureSeule && (
          <Link
            href="/planning/nouvelle"
            className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
          >
            Planifier
          </Link>
        )}
      </div>

      {/* Navigation de mois */}
      <div className="flex items-center justify-between">
        <Link
          href={`/planning?mois=${moisPrecedent}`}
          className="rounded-lg border border-line bg-surface px-4 py-2 font-medium text-soft transition hover:border-muted"
          aria-label="Mois précédent"
        >
          ←
        </Link>
        <span className="font-semibold capitalize text-foreground">
          {format(reference, "MMMM yyyy", { locale: fr })}
        </span>
        <Link
          href={`/planning?mois=${moisSuivant}`}
          className="rounded-lg border border-line bg-surface px-4 py-2 font-medium text-soft transition hover:border-muted"
          aria-label="Mois suivant"
        >
          →
        </Link>
      </div>

      {/* Grille du mois */}
      <div className="card p-3">
        <div className="mb-2 grid grid-cols-7 text-center text-[11px] font-medium uppercase text-muted">
          {["lun", "mar", "mer", "jeu", "ven", "sam", "dim"].map((j) => (
            <span key={j}>{j}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {jours.map((jour) => {
            const duJour = interventions.filter((i) => isSameDay(i.date, jour));
            const dansLeMois = isSameMonth(jour, reference);
            const aujourdHui = isSameDay(jour, new Date());
            return (
              <div key={jour.toISOString()} className="flex flex-col items-center py-1">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                    aujourdHui
                      ? "bg-accent font-semibold text-on-accent"
                      : dansLeMois
                        ? "text-foreground"
                        : "text-muted/50"
                  }`}
                >
                  {format(jour, "d")}
                </span>
                <span className="flex h-1.5 gap-0.5">
                  {duJour.slice(0, 3).map((i) => (
                    <span
                      key={i.id}
                      className={`h-1.5 w-1.5 rounded-full ${
                        i.statut === "ANNULEE" ? "bg-muted" : "bg-accent"
                      }`}
                    />
                  ))}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Liste chronologique du mois */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          {interventions.length} intervention{interventions.length > 1 ? "s" : ""} ce
          mois-ci
        </h2>
        {interventions.length === 0 ? (
          <p className="card p-4 text-soft">
            Rien de planifié ce mois-ci.
            {!lectureSeule && (
              <>
                {" "}
                <Link href="/planning/nouvelle" className="font-medium text-accent underline">
                  Planifier une intervention
                </Link>
              </>
            )}
          </p>
        ) : (
          <ul className="space-y-2">
            {interventions.map((i) => (
              <li
                key={i.id}
                className={`card p-4 ${i.statut === "ANNULEE" ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className={`block font-medium text-foreground ${
                        i.statut === "ANNULEE" ? "line-through" : ""
                      }`}
                    >
                      {i.titre}
                    </span>
                    <span className="block text-sm text-soft">
                      {i.client.nom} ·{" "}
                      {format(i.date, "EEE d MMM 'à' HH'h'mm", { locale: fr })} ·{" "}
                      {i.dureeMinutes} min
                    </span>
                    {i.notes && (
                      <span className="mt-1 block text-sm text-muted">{i.notes}</span>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${
                      i.statut === "TERMINEE"
                        ? "bg-accent text-on-accent"
                        : i.statut === "ANNULEE"
                          ? "bg-line-subtle text-muted"
                          : "bg-accent-weak text-accent"
                    }`}
                  >
                    {LIBELLES_STATUT[i.statut]}
                  </span>
                </div>
                {!lectureSeule && i.statut === "PLANIFIEE" && (
                  <ActionsIntervention interventionId={i.id} />
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
