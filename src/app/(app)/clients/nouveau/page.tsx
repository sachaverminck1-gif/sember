// Création d'un nouveau client.
import Link from "next/link";
import { getJardinierOrRedirect } from "@/lib/session";
import { FormulaireClient } from "@/components/FormulaireClient";

export default async function NouveauClientPage() {
  const { lectureSeule } = await getJardinierOrRedirect();

  if (lectureSeule) {
    return (
      <div className="card p-8 text-center">
        <p className="mb-5 text-soft">
          Votre essai est terminé. Abonnez-vous pour ajouter des clients.
        </p>
        <Link
          href="/abonnement-saas"
          className="inline-block rounded-lg bg-accent px-6 py-3 font-semibold text-on-accent transition hover:bg-accent-hover"
        >
          Voir les formules
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Nouveau client
      </h1>
      <FormulaireClient />
    </div>
  );
}
