// Récapitulatif en lecture d'un devis ou d'une facture (lignes + totaux).
import { calculerLigne, calculerDocument, formaterEuros } from "@/lib/montants";

export type LigneAffichable = {
  id: string;
  designation: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number;
};

export function RecapDocument({
  lignes,
  assujettiTVA,
}: {
  lignes: LigneAffichable[];
  assujettiTVA: boolean;
}) {
  const totaux = calculerDocument(lignes);

  return (
    <div className="card divide-y divide-line">
      {lignes.map((ligne) => {
        const { totalHT } = calculerLigne(ligne);
        return (
          <div key={ligne.id} className="flex items-start justify-between gap-3 p-4">
            <div className="min-w-0">
              <span className="block text-foreground">{ligne.designation}</span>
              <span className="block text-sm text-muted">
                {ligne.quantite} × {formaterEuros(Math.round(ligne.prixUnitaire * 100))}
                {assujettiTVA && ligne.tauxTVA > 0 && ` · TVA ${ligne.tauxTVA} %`}
              </span>
            </div>
            <span className="shrink-0 font-mono text-foreground">
              {formaterEuros(totalHT)}
            </span>
          </div>
        );
      })}

      <div className="space-y-1 p-4">
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
            <div className="flex justify-between pt-2 text-lg font-semibold">
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
    </div>
  );
}
