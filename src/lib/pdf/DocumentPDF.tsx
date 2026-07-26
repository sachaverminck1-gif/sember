// Rendu PDF partagé pour les devis et les factures.
//
// Les mentions légales varient selon le régime de TVA du jardinier :
//  - franchise en base (auto-entrepreneur) → mention obligatoire art. 293 B du CGI
//    et aucune colonne TVA ;
//  - assujetti → récapitulatif de TVA par taux.
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { calculerLigne, calculerDocument, formaterEuros } from "@/lib/montants";

export type LignePDF = {
  designation: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number;
};

export type DonneesDocumentPDF = {
  type: "DEVIS" | "FACTURE";
  numero: string;
  date: Date;
  /** Validité pour un devis, échéance de paiement pour une facture. */
  dateLimite?: Date | null;
  objet?: string | null;
  notes?: string | null;
  emetteur: {
    nom: string;
    entreprise?: string | null;
    adresse?: string | null;
    telephone?: string | null;
    email: string;
    siret?: string | null;
    assujettiTVA: boolean;
  };
  destinataire: {
    nom: string;
    adresse?: string | null;
    codePostal?: string | null;
    ville?: string | null;
  };
  lignes: LignePDF[];
};

const COULEUR_TEXTE = "#14181A";
const COULEUR_SOFT = "#5F6764";
const COULEUR_LIGNE = "#E4E6E2";
const COULEUR_ACCENT = "#17A46B";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
    fontSize: 10,
    color: COULEUR_TEXTE,
    fontFamily: "Helvetica",
  },
  enTete: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  titreDocument: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  numero: { fontSize: 11, color: COULEUR_SOFT, marginTop: 4 },
  blocDroite: { textAlign: "right" },
  nomEmetteur: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  petitTexte: { fontSize: 9, color: COULEUR_SOFT, marginTop: 2 },

  encadreClient: {
    borderWidth: 1,
    borderColor: COULEUR_LIGNE,
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
    maxWidth: 260,
    alignSelf: "flex-end",
  },
  labelClient: {
    fontSize: 8,
    color: COULEUR_SOFT,
    textTransform: "uppercase",
    marginBottom: 4,
  },

  objet: { marginBottom: 16 },
  objetLabel: { fontFamily: "Helvetica-Bold" },

  tableEnTete: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COULEUR_TEXTE,
    paddingBottom: 6,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  ligne: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COULEUR_LIGNE,
  },
  colDesignation: { flex: 1 },
  colQuantite: { width: 55, textAlign: "right" },
  colPrix: { width: 70, textAlign: "right" },
  colTVA: { width: 45, textAlign: "right" },
  colTotal: { width: 75, textAlign: "right" },

  totaux: { marginTop: 16, alignSelf: "flex-end", width: 240 },
  ligneTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  ligneTotalFort: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: COULEUR_TEXTE,
    fontFamily: "Helvetica-Bold",
    fontSize: 12,
  },

  encadreNotes: {
    marginTop: 24,
    padding: 10,
    backgroundColor: "#F6F7F5",
    borderRadius: 4,
  },

  mentions: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: COULEUR_SOFT,
    borderTopWidth: 1,
    borderTopColor: COULEUR_LIGNE,
    paddingTop: 8,
  },
  accent: { color: COULEUR_ACCENT },
});

export function DocumentPDF({ donnees }: { donnees: DonneesDocumentPDF }) {
  const { emetteur, destinataire, lignes, type } = donnees;
  const avecTVA = emetteur.assujettiTVA;
  const totaux = calculerDocument(lignes);

  const titre = type === "DEVIS" ? "Devis" : "Facture";
  const libelleDateLimite =
    type === "DEVIS" ? "Valable jusqu'au" : "À régler avant le";

  return (
    <Document title={`${titre} ${donnees.numero}`}>
      <Page size="A4" style={styles.page}>
        {/* En-tête : titre + émetteur */}
        <View style={styles.enTete}>
          <View>
            <Text style={styles.titreDocument}>{titre}</Text>
            <Text style={styles.numero}>{donnees.numero}</Text>
          </View>
          <View style={styles.blocDroite}>
            <Text style={styles.nomEmetteur}>
              {emetteur.entreprise || emetteur.nom}
            </Text>
            {emetteur.entreprise && (
              <Text style={styles.petitTexte}>{emetteur.nom}</Text>
            )}
            {emetteur.adresse && (
              <Text style={styles.petitTexte}>{emetteur.adresse}</Text>
            )}
            {emetteur.telephone && (
              <Text style={styles.petitTexte}>{emetteur.telephone}</Text>
            )}
            <Text style={styles.petitTexte}>{emetteur.email}</Text>
            {emetteur.siret && (
              <Text style={styles.petitTexte}>SIRET {emetteur.siret}</Text>
            )}
          </View>
        </View>

        {/* Destinataire */}
        <View style={styles.encadreClient}>
          <Text style={styles.labelClient}>Client</Text>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{destinataire.nom}</Text>
          {destinataire.adresse && <Text>{destinataire.adresse}</Text>}
          {(destinataire.codePostal || destinataire.ville) && (
            <Text>
              {[destinataire.codePostal, destinataire.ville]
                .filter(Boolean)
                .join(" ")}
            </Text>
          )}
        </View>

        {/* Dates et objet */}
        <View style={styles.objet}>
          <Text>
            <Text style={styles.objetLabel}>Date : </Text>
            {format(donnees.date, "d MMMM yyyy", { locale: fr })}
          </Text>
          {donnees.dateLimite && (
            <Text>
              <Text style={styles.objetLabel}>{libelleDateLimite} : </Text>
              {format(donnees.dateLimite, "d MMMM yyyy", { locale: fr })}
            </Text>
          )}
          {donnees.objet && (
            <Text>
              <Text style={styles.objetLabel}>Objet : </Text>
              {donnees.objet}
            </Text>
          )}
        </View>

        {/* Tableau des lignes */}
        <View style={styles.tableEnTete}>
          <Text style={styles.colDesignation}>Désignation</Text>
          <Text style={styles.colQuantite}>Qté</Text>
          <Text style={styles.colPrix}>Prix unit.</Text>
          {avecTVA && <Text style={styles.colTVA}>TVA</Text>}
          <Text style={styles.colTotal}>Total HT</Text>
        </View>

        {lignes.map((ligne, i) => {
          const { totalHT } = calculerLigne(ligne);
          return (
            <View style={styles.ligne} key={i}>
              <Text style={styles.colDesignation}>{ligne.designation}</Text>
              <Text style={styles.colQuantite}>{ligne.quantite}</Text>
              <Text style={styles.colPrix}>
                {formaterEuros(Math.round(ligne.prixUnitaire * 100))}
              </Text>
              {avecTVA && (
                <Text style={styles.colTVA}>{ligne.tauxTVA} %</Text>
              )}
              <Text style={styles.colTotal}>{formaterEuros(totalHT)}</Text>
            </View>
          );
        })}

        {/* Totaux */}
        <View style={styles.totaux}>
          {avecTVA ? (
            <>
              <View style={styles.ligneTotal}>
                <Text>Total HT</Text>
                <Text>{formaterEuros(totaux.totalHT)}</Text>
              </View>
              {totaux.parTaux.map((t) => (
                <View style={styles.ligneTotal} key={t.taux}>
                  <Text>TVA {t.taux} %</Text>
                  <Text>{formaterEuros(t.montantTVA)}</Text>
                </View>
              ))}
              <View style={styles.ligneTotalFort}>
                <Text>Total TTC</Text>
                <Text>{formaterEuros(totaux.totalTTC)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.ligneTotalFort}>
              <Text>Total à payer</Text>
              <Text>{formaterEuros(totaux.totalHT)}</Text>
            </View>
          )}
        </View>

        {/* Notes libres */}
        {donnees.notes && (
          <View style={styles.encadreNotes}>
            <Text>{donnees.notes}</Text>
          </View>
        )}

        {/* Mentions légales de pied de page */}
        <View style={styles.mentions} fixed>
          {!avecTVA && (
            <Text>TVA non applicable, article 293 B du Code général des impôts.</Text>
          )}
          {type === "FACTURE" && (
            <Text>
              En cas de retard de paiement : pénalités au taux légal et indemnité
              forfaitaire de 40 € pour frais de recouvrement (art. L441-10 du Code
              de commerce).
            </Text>
          )}
          {type === "DEVIS" && (
            <Text>
              Devis à retourner daté et signé avec la mention « Bon pour accord ».
            </Text>
          )}
          <Text style={styles.accent}>Document établi avec Sember</Text>
        </View>
      </Page>
    </Document>
  );
}
