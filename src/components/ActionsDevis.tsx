"use client";

// Actions sur un devis : changement de statut, conversion en facture, suppression.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageErreur } from "@/components/ui";

const STATUTS = [
  { code: "BROUILLON", label: "Brouillon" },
  { code: "ENVOYE", label: "Envoyé" },
  { code: "ACCEPTE", label: "Accepté" },
  { code: "REFUSE", label: "Refusé" },
];

export function ActionsDevis({
  devisId,
  statut,
  dejaFacture,
  factureId,
}: {
  devisId: string;
  statut: string;
  dejaFacture: boolean;
  factureId?: string | null;
}) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState<string | null>(null);
  const [confirmSuppression, setConfirmSuppression] = useState(false);

  async function changerStatut(nouveauStatut: string) {
    setErreur(null);
    setChargement("statut");
    const res = await fetch(`/api/devis/${devisId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: nouveauStatut }),
    });
    setChargement(null);
    if (!res.ok) {
      setErreur((await res.json().catch(() => null))?.error ?? "Erreur");
      return;
    }
    router.refresh();
  }

  async function convertir() {
    setErreur(null);
    setChargement("conversion");
    const res = await fetch(`/api/devis/${devisId}/convertir`, { method: "POST" });
    const data = await res.json().catch(() => null);
    setChargement(null);
    if (!res.ok) {
      setErreur(data?.error ?? "Conversion impossible");
      return;
    }
    router.push(`/factures/${data.id}`);
    router.refresh();
  }

  async function supprimer() {
    setErreur(null);
    setChargement("suppression");
    const res = await fetch(`/api/devis/${devisId}`, { method: "DELETE" });
    setChargement(null);
    if (!res.ok) {
      setErreur((await res.json().catch(() => null))?.error ?? "Suppression impossible");
      setConfirmSuppression(false);
      return;
    }
    router.push("/devis");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <MessageErreur message={erreur} />

      {/* Statut */}
      <div>
        <span className="mb-2 block text-sm font-medium text-soft">Statut</span>
        <div className="flex flex-wrap gap-2">
          {STATUTS.map((s) => (
            <button
              key={s.code}
              onClick={() => changerStatut(s.code)}
              disabled={chargement !== null || s.code === statut}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                s.code === statut
                  ? "bg-accent text-on-accent"
                  : "border border-line bg-surface text-soft hover:border-muted disabled:opacity-40"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Actions principales */}
      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={`/api/devis/${devisId}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-line bg-surface px-5 py-3.5 text-center font-semibold text-foreground transition hover:border-muted"
        >
          Télécharger le PDF
        </a>

        {dejaFacture ? (
          <a
            href={`/factures/${factureId}`}
            className="rounded-lg border border-accent bg-surface px-5 py-3.5 text-center font-semibold text-accent"
          >
            Voir la facture
          </a>
        ) : (
          <button
            onClick={convertir}
            disabled={chargement !== null}
            className="rounded-lg bg-accent px-5 py-3.5 font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-40"
          >
            {chargement === "conversion" ? "Conversion…" : "Convertir en facture"}
          </button>
        )}
      </div>

      {/* Suppression */}
      {!dejaFacture && (
        <div className="border-t border-line pt-4">
          {confirmSuppression ? (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-800">Supprimer ce devis ?</p>
              <div className="flex gap-3">
                <button
                  onClick={supprimer}
                  disabled={chargement !== null}
                  className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  Oui, supprimer
                </button>
                <button
                  onClick={() => setConfirmSuppression(false)}
                  className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-foreground"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmSuppression(true)}
              className="text-sm font-medium text-red-600 underline"
            >
              Supprimer ce devis
            </button>
          )}
        </div>
      )}
    </div>
  );
}
