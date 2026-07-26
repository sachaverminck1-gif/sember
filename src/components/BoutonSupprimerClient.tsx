"use client";

// Suppression d'un client avec confirmation explicite (pas de suppression accidentelle).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageErreur } from "@/components/ui";

export function BoutonSupprimerClient({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [confirmation, setConfirmation] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function supprimer() {
    setChargement(true);
    setErreur(null);
    const res = await fetch(`/api/clients/${clientId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErreur(data?.error ?? "Suppression impossible");
      setChargement(false);
      setConfirmation(false);
      return;
    }
    router.push("/clients");
    router.refresh();
  }

  if (!confirmation) {
    return (
      <div className="space-y-2">
        <MessageErreur message={erreur} />
        <button
          onClick={() => setConfirmation(true)}
          className="text-sm font-medium text-red-600 underline"
        >
          Supprimer ce client
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="font-medium text-red-800">Supprimer définitivement ce client ?</p>
      <div className="flex gap-3">
        <button
          onClick={supprimer}
          disabled={chargement}
          className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {chargement ? "Suppression…" : "Oui, supprimer"}
        </button>
        <button
          onClick={() => setConfirmation(false)}
          className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-foreground"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
