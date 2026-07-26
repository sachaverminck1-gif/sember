"use client";

// Actions rapides sur une intervention planifiée : terminer, annuler, supprimer.
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ActionsIntervention({ interventionId }: { interventionId: string }) {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function changerStatut(statut: "TERMINEE" | "ANNULEE") {
    setChargement(true);
    setErreur(null);
    const res = await fetch(`/api/interventions/${interventionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut }),
    });
    setChargement(false);
    if (!res.ok) {
      setErreur((await res.json().catch(() => null))?.error ?? "Erreur");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
      <button
        onClick={() => changerStatut("TERMINEE")}
        disabled={chargement}
        className="rounded-lg bg-accent-weak px-3 py-1.5 text-sm font-medium text-accent transition hover:bg-accent hover:text-on-accent disabled:opacity-40"
      >
        Terminée
      </button>
      <button
        onClick={() => changerStatut("ANNULEE")}
        disabled={chargement}
        className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-soft transition hover:border-muted disabled:opacity-40"
      >
        Annuler
      </button>
      {erreur && <span className="text-sm text-red-600">{erreur}</span>}
    </div>
  );
}
