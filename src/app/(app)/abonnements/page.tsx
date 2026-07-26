// Abonnements d'entretien : formules du jardinier + abonnements clients
// avec leurs prochaines échéances (D4 : affichage des échéances, pas de
// facturation automatique dans le MVP).
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getJardinierOrRedirect } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formaterEuros, enCentimes } from "@/lib/montants";
import {
  FormulaireFormule,
  FormulaireAbonnement,
  ActionsAbonnement,
  BoutonPlanifierEcheance,
} from "@/components/FormulairesAbonnements";

const LIBELLES_FREQUENCE: Record<string, string> = {
  HEBDOMADAIRE: "1 passage / semaine",
  BIMENSUELLE: "2 passages / mois",
  MENSUELLE: "1 passage / mois",
  TRIMESTRIELLE: "1 passage / trimestre",
};

const LIBELLES_STATUT: Record<string, string> = {
  ACTIF: "Actif",
  SUSPENDU: "Suspendu",
  RESILIE: "Résilié",
};

export default async function AbonnementsPage() {
  const { jardinier, lectureSeule } = await getJardinierOrRedirect();

  const [formules, abonnements] = await Promise.all([
    prisma.formule.findMany({
      where: { jardinierId: jardinier.id },
      include: { _count: { select: { abonnements: { where: { statut: "ACTIF" } } } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.abonnement.findMany({
      where: { jardinierId: jardinier.id },
      include: {
        client: { select: { nom: true } },
        formule: true,
        echeances: {
          where: { statut: "A_VENIR" },
          orderBy: { datePrevue: "asc" },
          take: 3,
          include: { intervention: { select: { id: true } } },
        },
      },
      orderBy: [{ statut: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const clients = await prisma.client.findMany({
    where: { jardinierId: jardinier.id },
    select: { id: true, nom: true },
    orderBy: { nom: "asc" },
  });

  // MRR du jardinier : somme des formules des abonnements actifs.
  const mrrCentimes = abonnements
    .filter((a) => a.statut === "ACTIF")
    .reduce((somme, a) => somme + enCentimes(String(a.formule.prixMensuel)), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Abonnements d&apos;entretien
        </h1>
        {mrrCentimes > 0 && (
          <p className="mt-1 text-soft">
            Revenu mensuel récurrent :{" "}
            <span className="font-mono font-semibold text-accent">
              {formaterEuros(mrrCentimes)}
            </span>
          </p>
        )}
      </div>

      {/* Formules */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Mes formules
        </h2>
        {formules.map((f) => (
          <div key={f.id} className="card p-4">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-semibold text-foreground">{f.nom}</span>
              <span className="shrink-0 font-mono font-semibold text-foreground">
                {formaterEuros(enCentimes(String(f.prixMensuel)))}
                <span className="text-sm font-normal text-muted"> /mois</span>
              </span>
            </div>
            <p className="text-sm text-soft">
              {LIBELLES_FREQUENCE[f.frequence]}
              {f.description && ` · ${f.description}`}
            </p>
            <p className="mt-1 text-xs text-muted">
              {f._count.abonnements} client{f._count.abonnements > 1 ? "s" : ""} abonné
              {f._count.abonnements > 1 ? "s" : ""}
            </p>
          </div>
        ))}
        {!lectureSeule && <FormulaireFormule />}
      </section>

      {/* Souscription */}
      {!lectureSeule && formules.length > 0 && clients.length > 0 && (
        <FormulaireAbonnement
          clients={clients}
          formules={formules.map((f) => ({ id: f.id, nom: f.nom }))}
        />
      )}
      {!lectureSeule && formules.length > 0 && clients.length === 0 && (
        <p className="card p-4 text-sm text-soft">
          <Link href="/clients/nouveau" className="font-medium text-accent underline">
            Créez un client
          </Link>{" "}
          pour pouvoir l&apos;abonner à une formule.
        </p>
      )}

      {/* Abonnements en cours */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Clients abonnés ({abonnements.filter((a) => a.statut !== "RESILIE").length})
        </h2>
        {abonnements.length === 0 ? (
          <p className="card p-4 text-soft">
            Aucun abonnement pour l&apos;instant. Créez une formule puis abonnez vos
            clients réguliers : revenu prévisible chaque mois.
          </p>
        ) : (
          abonnements.map((a) => (
            <div
              key={a.id}
              className={`card p-4 ${a.statut === "RESILIE" ? "opacity-60" : ""}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <span className="block font-medium text-foreground">
                    {a.client.nom}
                  </span>
                  <span className="block text-sm text-soft">
                    {a.formule.nom} ·{" "}
                    {formaterEuros(enCentimes(String(a.formule.prixMensuel)))}/mois ·
                    depuis le {format(a.dateDebut, "d MMM yyyy", { locale: fr })}
                  </span>
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${
                    a.statut === "ACTIF"
                      ? "bg-accent text-on-accent"
                      : a.statut === "SUSPENDU"
                        ? "bg-accent-weak text-accent"
                        : "bg-line-subtle text-muted"
                  }`}
                >
                  {LIBELLES_STATUT[a.statut]}
                </span>
              </div>

              {/* Prochaines échéances */}
              {a.statut === "ACTIF" && a.echeances.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  <span className="block text-xs font-medium uppercase text-muted">
                    Prochains passages
                  </span>
                  {a.echeances.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between text-sm text-soft"
                    >
                      <span className="capitalize">
                        {format(e.datePrevue, "EEEE d MMMM", { locale: fr })}
                      </span>
                      {!lectureSeule && (
                        <BoutonPlanifierEcheance
                          echeanceId={e.id}
                          dejaPlanifiee={Boolean(e.intervention)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!lectureSeule && (
                <ActionsAbonnement abonnementId={a.id} statut={a.statut} />
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
