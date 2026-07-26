// Modification d'une facture — réservée aux brouillons (une facture émise est figée).
import { notFound, redirect } from "next/navigation";
import { getJardinierOrRedirect } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EditeurDocument } from "@/components/EditeurDocument";

export default async function ModifierFacturePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { jardinier, lectureSeule } = await getJardinierOrRedirect();
  const { id } = await params;

  if (lectureSeule) redirect(`/factures/${id}`);

  const facture = await prisma.facture.findFirst({
    where: { id, jardinierId: jardinier.id },
    include: { lignes: { orderBy: { ordre: "asc" } } },
  });
  if (!facture) notFound();

  if (facture.statut !== "BROUILLON") redirect(`/factures/${id}`);

  const clients = await prisma.client.findMany({
    where: { jardinierId: jardinier.id },
    select: { id: true, nom: true },
    orderBy: { nom: "asc" },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Modifier la facture
      </h1>
      <EditeurDocument
        type="facture"
        clients={clients}
        assujettiTVA={jardinier.assujettiTVA}
        document={{
          id: facture.id,
          clientId: facture.clientId,
          objet: facture.objet,
          notes: facture.notes,
          lignes: facture.lignes.map((l) => ({
            designation: l.designation,
            quantite: String(Number(l.quantite)),
            prixUnitaire: String(Number(l.prixUnitaire)),
            tauxTVA: String(Number(l.tauxTVA)),
          })),
        }}
      />
    </div>
  );
}
