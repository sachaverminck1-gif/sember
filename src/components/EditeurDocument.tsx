"use client";

// Éditeur de devis / facture : sélection du client, lignes de prestation,
// totaux calculés en direct. Utilisé pour la création et la modification.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Champ, ChampTexteLong, Selection, MessageErreur } from "@/components/ui";
import { calculerDocument, formaterEuros } from "@/lib/montants";

type ClientOption = { id: string; nom: string };

type LigneEditable = {
  designation: string;
  quantite: string;
  prixUnitaire: string;
  tauxTVA: string;
};

export type DocumentInitial = {
  id?: string;
  clientId?: string;
  objet?: string | null;
  notes?: string | null;
  lignes?: { designation: string; quantite: string; prixUnitaire: string; tauxTVA: string }[];
};

const LIGNE_VIDE: LigneEditable = {
  designation: "",
  quantite: "1",
  prixUnitaire: "",
  tauxTVA: "20",
};

export function EditeurDocument({
  type,
  clients,
  assujettiTVA,
  document,
}: {
  type: "devis" | "facture";
  clients: ClientOption[];
  assujettiTVA: boolean;
  document?: DocumentInitial;
}) {
  const router = useRouter();
  const edition = Boolean(document?.id);

  const [clientId, setClientId] = useState(document?.clientId ?? "");
  const [objet, setObjet] = useState(document?.objet ?? "");
  const [notes, setNotes] = useState(document?.notes ?? "");
  const [lignes, setLignes] = useState<LigneEditable[]>(
    document?.lignes?.length
      ? document.lignes
      : [{ ...LIGNE_VIDE, tauxTVA: assujettiTVA ? "20" : "0" }]
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  function modifierLigne(index: number, champ: keyof LigneEditable, valeur: string) {
    setLignes((precedent) =>
      precedent.map((l, i) => (i === index ? { ...l, [champ]: valeur } : l))
    );
  }

  function ajouterLigne() {
    setLignes((p) => [...p, { ...LIGNE_VIDE, tauxTVA: assujettiTVA ? "20" : "0" }]);
  }

  function supprimerLigne(index: number) {
    setLignes((p) => (p.length === 1 ? p : p.filter((_, i) => i !== index)));
  }

  // Totaux en direct : seules les lignes chiffrables sont comptées.
  const totaux = calculerDocument(
    lignes
      .filter((l) => l.prixUnitaire !== "" && l.quantite !== "")
      .map((l) => ({
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        tauxTVA: assujettiTVA ? l.tauxTVA : "0",
      }))
  );

  async function enregistrer() {
    setErreur(null);

    if (!clientId) {
      setErreur("Sélectionnez un client");
      return;
    }
    const lignesRemplies = lignes.filter(
      (l) => l.designation.trim() !== "" && l.prixUnitaire !== ""
    );
    if (lignesRemplies.length === 0) {
      setErreur("Ajoutez au moins une ligne avec une désignation et un prix");
      return;
    }

    setChargement(true);
    const corps = {
      clientId,
      objet,
      notes,
      lignes: lignesRemplies.map((l) => ({
        designation: l.designation,
        quantite: Number(l.quantite || 1),
        prixUnitaire: Number(l.prixUnitaire),
        tauxTVA: assujettiTVA ? Number(l.tauxTVA || 0) : 0,
      })),
    };

    const base = type === "devis" ? "/api/devis" : "/api/factures";
    const res = await fetch(edition ? `${base}/${document!.id}` : base, {
      method: edition ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corps),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErreur(data?.error ?? "Une erreur est survenue");
      setChargement(false);
      return;
    }

    const cree = await res.json();
    router.push(type === "devis" ? `/devis/${cree.id}` : `/factures/${cree.id}`);
    router.refresh();
  }

  if (clients.length === 0) {
    return (
      <div className="card p-6 text-center">
        <p className="mb-4 text-soft">
          Vous devez d&apos;abord créer un client pour établir un {type}.
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
    <div className="space-y-5">
      <Selection
        label="Client *"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
      >
        <option value="">— Choisir un client —</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nom}
          </option>
        ))}
      </Selection>

      <Champ
        label="Objet (ex. Entretien de jardin printemps)"
        value={objet}
        onChange={(e) => setObjet(e.target.value)}
      />

      {/* Lignes de prestation */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Prestations
        </h2>

        {lignes.map((ligne, index) => (
          <div key={index} className="card space-y-3 p-4">
            <Champ
              label="Désignation"
              value={ligne.designation}
              onChange={(e) => modifierLigne(index, "designation", e.target.value)}
              placeholder="Tonte de pelouse"
            />
            <div className={`grid gap-3 ${assujettiTVA ? "grid-cols-3" : "grid-cols-2"}`}>
              <Champ
                label="Quantité"
                type="number"
                step="0.5"
                min="0"
                inputMode="decimal"
                value={ligne.quantite}
                onChange={(e) => modifierLigne(index, "quantite", e.target.value)}
              />
              <Champ
                label="Prix unit. €"
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={ligne.prixUnitaire}
                onChange={(e) => modifierLigne(index, "prixUnitaire", e.target.value)}
              />
              {assujettiTVA && (
                <Selection
                  label="TVA"
                  value={ligne.tauxTVA}
                  onChange={(e) => modifierLigne(index, "tauxTVA", e.target.value)}
                >
                  <option value="0">0 %</option>
                  <option value="10">10 %</option>
                  <option value="20">20 %</option>
                </Selection>
              )}
            </div>
            {lignes.length > 1 && (
              <button
                type="button"
                onClick={() => supprimerLigne(index)}
                className="text-sm text-red-600 underline"
              >
                Retirer cette ligne
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={ajouterLigne}
          className="w-full rounded-lg border border-dashed border-line py-3 text-sm font-medium text-soft transition hover:border-accent hover:text-accent"
        >
          + Ajouter une prestation
        </button>
      </div>

      {/* Totaux calculés en direct */}
      <div className="card space-y-1 p-4">
        {assujettiTVA ? (
          <>
            <div className="flex justify-between text-soft">
              <span>Total HT</span>
              <span className="font-mono">{formaterEuros(totaux.totalHT)}</span>
            </div>
            {totaux.parTaux
              .filter((t) => t.taux > 0)
              .map((t) => (
                <div key={t.taux} className="flex justify-between text-soft">
                  <span>TVA {t.taux} %</span>
                  <span className="font-mono">{formaterEuros(t.montantTVA)}</span>
                </div>
              ))}
            <div className="flex justify-between border-t border-line pt-2 text-lg font-semibold">
              <span>Total TTC</span>
              <span className="font-mono">{formaterEuros(totaux.totalTTC)}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-lg font-semibold">
            <span>Total</span>
            <span className="font-mono">{formaterEuros(totaux.totalHT)}</span>
          </div>
        )}
      </div>

      <ChampTexteLong
        label="Notes (conditions, précisions…)"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <MessageErreur message={erreur} />

      <button
        onClick={enregistrer}
        disabled={chargement}
        className="w-full rounded-lg bg-accent px-6 py-4 text-base font-semibold text-on-accent transition hover:bg-accent-hover disabled:opacity-40"
      >
        {chargement
          ? "Enregistrement…"
          : edition
            ? "Enregistrer les modifications"
            : type === "devis"
              ? "Créer le devis"
              : "Créer la facture"}
      </button>
    </div>
  );
}
