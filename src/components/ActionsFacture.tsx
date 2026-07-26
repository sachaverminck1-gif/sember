"use client";

// Actions sur une facture. Le jeu d'actions dépend du statut :
// un brouillon peut encore être modifié ou supprimé ; une facture émise est
// figée (on peut seulement l'encaisser ou l'annuler).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageErreur } from "@/components/ui";

export function ActionsFacture({
  factureId,
  statut,
}: {
  factureId: string;
  statut: string;
}) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [confirmSuppression, setConfirmSuppression] = useState(false);

  async function changerStatut(nouveauStatut: string) {
    setErreur(null);
    setChargement(true);
    const res = await fetch(`/api/factures/${factureId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: nouveauStatut }),
    });
    setChargement(false);
    if (!res.ok) {
      setErreur((await res.json().catch(() => null))?.error ?? "Erreur");
      return;
    }
    router.refresh();
  }

  async function supprimer() {
    setErreur(null);
    setChargement(true);
    const res = await fetch(`/api/factures/${factureId}`, { method: "DELETE" });
    setChargement(false);
    if (!res.ok) {
      setErreur((await res.json().catch(() => null))?.error ?? "Suppression impossible");
      setConfirmSuppression(false);
      return;
    }
    router.push("/factures");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <MessageErreur message={erreur} />

      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={`/api/factures/${factureId}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-line bg-surface px-5 py-3.5 text-center font-semibold text-foreground transition hover:border-muted"
        >
          Télécharger le PDF
        </a>

        {statut === "BROUILLON" && (
          <button
            onClick={() => changerStatut("EMISE")}
            disabled={chargement}
            className="rounded-lg bg-accent px-5 py-3.5 font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-40"
          >
            Émettre la facture
          </button>
        )}

        {statut === "EMISE" && (
          <button
            onClick={() => changerStatut("PAYEE")}
            disabled={chargement}
            className="rounded-lg bg-accent px-5 py-3.5 font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-40"
          >
            Marquer comme payée
          </button>
        )}

        {statut === "PAYEE" && (
          <div className="rounded-lg bg-accent-weak px-5 py-3.5 text-center font-semibold text-accent">
            Facture encaissée
          </div>
        )}

        {statut === "ANNULEE" && (
          <div className="rounded-lg border border-line px-5 py-3.5 text-center font-medium text-muted">
            Facture annulée
          </div>
        )}
      </div>

      {/* Actions secondaires selon le statut */}
      <div className="border-t border-line pt-4">
        {statut === "BROUILLON" &&
          (confirmSuppression ? (
            <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="font-medium text-red-800">Supprimer ce brouillon ?</p>
              <div className="flex gap-3">
                <button
                  onClick={supprimer}
                  disabled={chargement}
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
              Supprimer ce brouillon
            </button>
          ))}

        {(statut === "EMISE" || statut === "PAYEE") && (
          <button
            onClick={() => changerStatut("ANNULEE")}
            disabled={chargement}
            className="text-sm font-medium text-red-600 underline disabled:opacity-40"
          >
            Annuler cette facture
          </button>
        )}
      </div>
    </div>
  );
}
