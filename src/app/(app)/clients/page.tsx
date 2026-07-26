// Liste des clients du jardinier connecté, avec indicateur de quota (Starter).
import Link from "next/link";
import { getJardinierOrRedirect } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { QUOTA_CLIENTS } from "@/lib/quotas";

export default async function ClientsPage() {
  const { jardinier, lectureSeule } = await getJardinierOrRedirect();

  const clients = await prisma.client.findMany({
    where: { jardinierId: jardinier.id },
    orderBy: { nom: "asc" },
  });

  const limite = QUOTA_CLIENTS[jardinier.plan];
  const quotaAtteint = limite !== null && clients.length >= limite;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Clients{" "}
          <span className="font-mono text-base font-normal text-muted">
            {clients.length}
            {limite !== null ? `/${limite}` : ""}
          </span>
        </h1>
        {!lectureSeule && !quotaAtteint && (
          <Link
            href="/clients/nouveau"
            className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-on-accent transition hover:bg-accent-hover"
          >
            Ajouter
          </Link>
        )}
      </div>

      {quotaAtteint && (
        <p className="rounded-lg bg-accent-weak px-4 py-3 text-sm text-foreground">
          Limite de {limite} clients atteinte (formule Starter).{" "}
          <Link href="/abonnement-saas" className="font-semibold text-accent underline">
            Passer à la formule Pro
          </Link>
        </p>
      )}

      {clients.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="mb-5 text-soft">Aucun client pour l&apos;instant.</p>
          {!lectureSeule && (
            <Link
              href="/clients/nouveau"
              className="inline-block rounded-lg bg-accent px-6 py-3 text-base font-semibold text-on-accent transition hover:bg-accent-hover"
            >
              Ajouter mon premier client
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {clients.map((c) => (
            <li key={c.id}>
              <Link
                href={`/clients/${c.id}`}
                className="card block p-4 transition hover:border-muted"
              >
                <span className="block font-medium text-foreground">{c.nom}</span>
                <span className="block truncate text-sm text-soft">
                  {[c.ville, c.telephone].filter(Boolean).join(" · ") || "—"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
