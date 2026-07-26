"use client";

// Composants interactifs de la page Abonnements :
// création de formule, souscription d'un client, actions sur un abonnement,
// planification d'une échéance.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Champ, Selection, MessageErreur } from "@/components/ui";

const FREQUENCES = [
  { code: "HEBDOMADAIRE", label: "1 passage / semaine" },
  { code: "BIMENSUELLE", label: "2 passages / mois" },
  { code: "MENSUELLE", label: "1 passage / mois" },
  { code: "TRIMESTRIELLE", label: "1 passage / trimestre" },
];

// ---------- Création de formule ----------

export function FormulaireFormule() {
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/formules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: String(form.get("nom") ?? ""),
        description: String(form.get("description") ?? ""),
        frequence: String(form.get("frequence") ?? "MENSUELLE"),
        prixMensuel: Number(form.get("prixMensuel") ?? 0),
      }),
    });

    setChargement(false);
    if (!res.ok) {
      setErreur((await res.json().catch(() => null))?.error ?? "Erreur");
      return;
    }
    setOuvert(false);
    router.refresh();
  }

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="w-full rounded-lg border border-dashed border-line py-3 text-sm font-medium text-soft transition hover:border-accent hover:text-accent"
      >
        + Créer une formule
      </button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-4">
      <Champ label="Nom de la formule *" name="nom" required placeholder="Formule Sérénité" />
      <Champ label="Description" name="description" placeholder="Tonte, taille, désherbage…" />
      <div className="grid grid-cols-2 gap-3">
        <Selection label="Fréquence *" name="frequence" defaultValue="BIMENSUELLE">
          {FREQUENCES.map((f) => (
            <option key={f.code} value={f.code}>
              {f.label}
            </option>
          ))}
        </Selection>
        <Champ
          label="Prix mensuel € *"
          name="prixMensuel"
          type="number"
          step="0.01"
          min="0"
          required
          inputMode="decimal"
        />
      </div>
      <MessageErreur message={erreur} />
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={chargement}
          className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-on-accent disabled:opacity-40"
        >
          {chargement ? "Création…" : "Créer la formule"}
        </button>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="rounded-lg border border-line px-5 py-2.5 text-sm font-semibold text-soft"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}

// ---------- Souscription d'un abonnement ----------

export function FormulaireAbonnement({
  clients,
  formules,
}: {
  clients: { id: string; nom: string }[];
  formules: { id: string; nom: string }[];
}) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const form = new FormData(e.currentTarget);
    const dateDebut = String(form.get("dateDebut") ?? "");
    const res = await fetch("/api/abonnements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: String(form.get("clientId") ?? ""),
        formuleId: String(form.get("formuleId") ?? ""),
        ...(dateDebut ? { dateDebut: `${dateDebut}T09:00:00` } : {}),
      }),
    });

    setChargement(false);
    if (!res.ok) {
      setErreur((await res.json().catch(() => null))?.error ?? "Erreur");
      return;
    }
    (e.target as HTMLFormElement).reset?.();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-4">
      <h3 className="font-semibold text-foreground">Abonner un client</h3>
      <Selection label="Client *" name="clientId" required defaultValue="">
        <option value="" disabled>
          — Choisir un client —
        </option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nom}
          </option>
        ))}
      </Selection>
      <Selection label="Formule *" name="formuleId" required defaultValue="">
        <option value="" disabled>
          — Choisir une formule —
        </option>
        {formules.map((f) => (
          <option key={f.id} value={f.id}>
            {f.nom}
          </option>
        ))}
      </Selection>
      <Champ label="Premier passage (par défaut : aujourd'hui)" name="dateDebut" type="date" />
      <MessageErreur message={erreur} />
      <button
        type="submit"
        disabled={chargement}
        className="w-full rounded-lg bg-accent px-5 py-3 font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-40 sm:w-auto"
      >
        {chargement ? "Souscription…" : "Abonner ce client"}
      </button>
    </form>
  );
}

// ---------- Actions sur un abonnement ----------

export function ActionsAbonnement({
  abonnementId,
  statut,
}: {
  abonnementId: string;
  statut: string;
}) {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);
  const [confirmResiliation, setConfirmResiliation] = useState(false);

  async function changerStatut(nouveau: string) {
    setChargement(true);
    await fetch(`/api/abonnements/${abonnementId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: nouveau }),
    });
    setChargement(false);
    setConfirmResiliation(false);
    router.refresh();
  }

  if (statut === "RESILIE") return null;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
      {statut === "ACTIF" ? (
        <button
          onClick={() => changerStatut("SUSPENDU")}
          disabled={chargement}
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-soft transition hover:border-muted disabled:opacity-40"
        >
          Suspendre
        </button>
      ) : (
        <button
          onClick={() => changerStatut("ACTIF")}
          disabled={chargement}
          className="rounded-lg bg-accent-weak px-3 py-1.5 text-sm font-medium text-accent disabled:opacity-40"
        >
          Reprendre
        </button>
      )}

      {confirmResiliation ? (
        <span className="flex items-center gap-2">
          <button
            onClick={() => changerStatut("RESILIE")}
            disabled={chargement}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Confirmer la résiliation
          </button>
          <button
            onClick={() => setConfirmResiliation(false)}
            className="text-sm text-soft underline"
          >
            Annuler
          </button>
        </span>
      ) : (
        <button
          onClick={() => setConfirmResiliation(true)}
          className="text-sm font-medium text-red-600 underline"
        >
          Résilier
        </button>
      )}
    </div>
  );
}

// ---------- Planifier une échéance ----------

export function BoutonPlanifierEcheance({
  echeanceId,
  dejaPlanifiee,
}: {
  echeanceId: string;
  dejaPlanifiee: boolean;
}) {
  const router = useRouter();
  const [chargement, setChargement] = useState(false);

  if (dejaPlanifiee) {
    return <span className="text-xs font-medium text-accent">Au planning</span>;
  }

  async function planifier() {
    setChargement(true);
    await fetch(`/api/echeances/${echeanceId}/planifier`, { method: "POST" });
    setChargement(false);
    router.refresh();
  }

  return (
    <button
      onClick={planifier}
      disabled={chargement}
      className="rounded bg-accent-weak px-2 py-1 text-xs font-medium text-accent transition hover:bg-accent hover:text-on-accent disabled:opacity-40"
    >
      {chargement ? "…" : "Planifier"}
    </button>
  );
}
