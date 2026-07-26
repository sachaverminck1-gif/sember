// Fiche client : consultation + édition + suppression.
// La requête vérifie l'appartenance au jardinier connecté (multi-tenant).
import { notFound } from "next/navigation";
import { getJardinierOrRedirect } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { FormulaireClient } from "@/components/FormulaireClient";
import { BoutonSupprimerClient } from "@/components/BoutonSupprimerClient";

export default async function FicheClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { jardinier, lectureSeule } = await getJardinierOrRedirect();
  const { id } = await params;

  const client = await prisma.client.findFirst({
    where: { id, jardinierId: jardinier.id },
  });
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {client.nom}
      </h1>

      {lectureSeule ? (
        // Essai expiré : consultation seule, pas de formulaire d'édition.
        <div className="card space-y-2 p-4 text-soft">
          {client.adresse && <p>{client.adresse}</p>}
          {(client.codePostal || client.ville) && (
            <p>{[client.codePostal, client.ville].filter(Boolean).join(" ")}</p>
          )}
          {client.telephone && <p>{client.telephone}</p>}
          {client.email && <p>{client.email}</p>}
          {client.notes && <p className="text-muted">{client.notes}</p>}
        </div>
      ) : (
        <>
          <FormulaireClient client={client} />
          <div className="border-t border-line pt-5">
            <BoutonSupprimerClient clientId={client.id} />
          </div>
        </>
      )}
    </div>
  );
}
