"use client";

// Formulaire de planification d'une intervention.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Champ, ChampTexteLong, Selection, BoutonPrincipal, MessageErreur } from "@/components/ui";

type ClientOption = { id: string; nom: string };

export function FormulaireIntervention({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const form = new FormData(e.currentTarget);
    const date = String(form.get("date") ?? "");
    const heure = String(form.get("heure") ?? "09:00");

    const res = await fetch("/api/interventions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: String(form.get("clientId") ?? ""),
        titre: String(form.get("titre") ?? ""),
        date: `${date}T${heure}:00`,
        dureeMinutes: Number(form.get("dureeMinutes") ?? 60),
        notes: String(form.get("notes") ?? ""),
      }),
    });

    if (!res.ok) {
      setErreur((await res.json().catch(() => null))?.error ?? "Une erreur est survenue");
      setChargement(false);
      return;
    }

    const creee = await res.json();
    // Retour au planning, sur le mois de l'intervention créée.
    const mois = String(creee.date).slice(0, 7);
    router.push(`/planning?mois=${mois}`);
    router.refresh();
  }

  if (clients.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="mb-4 text-soft">
          Vous devez d&apos;abord créer un client pour planifier une intervention.
        </p>
        <a
          href="/clients/nouveau"
          className="inline-block rounded-lg bg-accent px-5 py-3 font-semibold text-on-accent"
        >
          Ajouter un client
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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

      <Champ
        label="Intervention *"
        name="titre"
        required
        placeholder="Tonte + taille de haie"
      />

      <div className="grid grid-cols-2 gap-3">
        <Champ label="Date *" name="date" type="date" required />
        <Champ label="Heure *" name="heure" type="time" defaultValue="09:00" required />
      </div>

      <Selection label="Durée" name="dureeMinutes" defaultValue="60">
        <option value="30">30 min</option>
        <option value="60">1 h</option>
        <option value="90">1 h 30</option>
        <option value="120">2 h</option>
        <option value="180">3 h</option>
        <option value="240">4 h</option>
        <option value="480">Journée</option>
      </Selection>

      <ChampTexteLong label="Notes" name="notes" rows={2} />

      <MessageErreur message={erreur} />

      <BoutonPrincipal type="submit" disabled={chargement}>
        {chargement ? "Planification…" : "Planifier l'intervention"}
      </BoutonPrincipal>
    </form>
  );
}
