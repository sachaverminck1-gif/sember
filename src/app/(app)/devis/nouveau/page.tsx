// Création d'un nouveau devis.
import Link from "next/link";
import { getJardinierOrRedirect } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EditeurDocument } from "@/components/EditeurDocument";

export default async function NouveauDevisPage() {
  const { jardinier, lectureSeule } = await getJardinierOrRedirect();

  if (lectureSeule) {
    return (
      <div className="card p-8 text-center">
        <p className="mb-5 text-soft">
          Votre essai est terminé. Abonnez-vous pour créer des devis.
        </p>
        <Link
          href="/abonnement-saas"
          className="inline-block rounded-lg bg-accent px-6 py-3 font-semibold text-on-accent"
        >
          Voir les formules
        </Link>
      </div>
    );
  }

  const clients = await prisma.client.findMany({
    where: { jardinierId: jardinier.id },
    select: { id: true, nom: true },
    orderBy: { nom: "asc" },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Nouveau devis
      </h1>
      <EditeurDocument
        type="devis"
        clients={clients}
        assujettiTVA={jardinier.assujettiTVA}
      />
    </div>
  );
}
