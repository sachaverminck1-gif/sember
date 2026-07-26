"use client";

// Bouton de souscription d'un plan SaaS : redirige vers Stripe Checkout.
import { useState } from "react";
import { MessageErreur } from "@/components/ui";

export function BoutonSouscrirePlan({
  plan,
  actuel,
}: {
  plan: "STARTER" | "PRO" | "BUSINESS";
  actuel: boolean;
}) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function souscrire() {
    setErreur(null);
    setChargement(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json().catch(() => null);
    setChargement(false);
    if (!res.ok || !data?.url) {
      setErreur(data?.error ?? "Le paiement est momentanément indisponible");
      return;
    }
    window.location.href = data.url;
  }

  if (actuel) {
    return <p className="mt-3 text-sm font-semibold text-accent">Votre formule</p>;
  }

  return (
    <div className="mt-4 space-y-2">
      <MessageErreur message={erreur} />
      <button
        onClick={souscrire}
        disabled={chargement}
        className="w-full rounded-lg bg-accent px-5 py-3 font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-40"
      >
        {chargement ? "Redirection…" : "Choisir cette formule"}
      </button>
    </div>
  );
}
