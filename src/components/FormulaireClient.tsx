"use client";

// Formulaire client partagé entre création et édition.
// Soumet vers l'API et affiche les erreurs renvoyées (validation, quota, paywall).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Champ, ChampTexteLong, BoutonPrincipal, MessageErreur } from "@/components/ui";

type ClientData = {
  id?: string;
  nom?: string;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  telephone?: string | null;
  email?: string | null;
  notes?: string | null;
};

export function FormulaireClient({ client }: { client?: ClientData }) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const edition = Boolean(client?.id);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const form = new FormData(e.currentTarget);
    const donnees = {
      nom: String(form.get("nom") ?? ""),
      adresse: String(form.get("adresse") ?? ""),
      codePostal: String(form.get("codePostal") ?? ""),
      ville: String(form.get("ville") ?? ""),
      telephone: String(form.get("telephone") ?? ""),
      email: String(form.get("email") ?? ""),
      notes: String(form.get("notes") ?? ""),
    };

    const res = await fetch(edition ? `/api/clients/${client!.id}` : "/api/clients", {
      method: edition ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(donnees),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErreur(data?.error ?? "Une erreur est survenue");
      setChargement(false);
      return;
    }

    router.push("/clients");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Champ label="Nom du client *" name="nom" required defaultValue={client?.nom ?? ""} />
      <Champ label="Adresse" name="adresse" defaultValue={client?.adresse ?? ""} />
      <div className="grid grid-cols-2 gap-3">
        <Champ label="Code postal" name="codePostal" defaultValue={client?.codePostal ?? ""} />
        <Champ label="Ville" name="ville" defaultValue={client?.ville ?? ""} />
      </div>
      <Champ label="Téléphone" name="telephone" type="tel" defaultValue={client?.telephone ?? ""} />
      <Champ label="Email" name="email" type="email" defaultValue={client?.email ?? ""} />
      <ChampTexteLong
        label="Notes (code portail, particularités du jardin…)"
        name="notes"
        rows={3}
        defaultValue={client?.notes ?? ""}
      />

      <MessageErreur message={erreur} />

      <BoutonPrincipal type="submit" disabled={chargement}>
        {chargement ? "Enregistrement…" : edition ? "Enregistrer" : "Ajouter le client"}
      </BoutonPrincipal>
    </form>
  );
}
