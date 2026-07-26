// Modification d'un devis existant (impossible s'il a déjà été facturé).
import { notFound, redirect } from "next/navigation";
import { getJardinierOrRedirect } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { EditeurDocument } from "@/components/EditeurDocument";

export default async function ModifierDevisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { jardinier, lectureSeule } = await getJardinierOrRedirect();
  const { id } = await params;

  if (lectureSeule) redirect(`/devis/${id}`);

  const devis = await prisma.devis.findFirst({
    where: { id, jardinierId: jardinier.id },
    include: { lignes: { orderBy: { ordre: "asc" } }, facture: { select: { id: true } } },
  });
  if (!devis) notFound();

  // Un devis facturé est figé : la facture en dépend.
  if (devis.facture) redirect(`/devis/${id}`);

  const clients = await prisma.client.findMany({
    where: { jardinierId: jardinier.id },
    select: { id: true, nom: true },
    orderBy: { nom: "asc" },
  });

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Modifier le devis
      </h1>
      <EditeurDocument
        type="devis"
        clients={clients}
        assujettiTVA={jardinier.assujettiTVA}
        document={{
          id: devis.id,
          clientId: devis.clientId,
          objet: devis.objet,
          notes: devis.notes,
          lignes: devis.lignes.map((l) => ({
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
