// ============================================================
// Seed de démonstration : un jardinier de test avec quelques
// clients, prestations, un devis, une facture, des interventions
// et un abonnement avec échéances.
// Lancement : npx prisma db seed
// ============================================================
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";
import { addDays } from "date-fns";

// Prisma 7 : adapter de driver explicite (pg → PostgreSQL/Neon)
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Jardinier de démo — email: demo@findjardinier.fr / mot de passe: demo1234
  const passwordHash = await argon2.hash("demo1234");

  const jardinier = await prisma.jardinier.upsert({
    where: { email: "demo@findjardinier.fr" },
    update: {},
    create: {
      email: "demo@findjardinier.fr",
      passwordHash,
      nom: "Jean Dupont",
      entreprise: "Les Jardins de Jean",
      telephone: "06 12 34 56 78",
      assujettiTVA: false, // franchise en base → factures sans TVA
      trialEndsAt: addDays(new Date(), 7),
    },
  });

  // Clients
  const [clientA, clientB] = await Promise.all([
    prisma.client.create({
      data: {
        jardinierId: jardinier.id,
        nom: "Mme Martin",
        adresse: "12 rue des Lilas",
        codePostal: "31000",
        ville: "Toulouse",
        telephone: "06 98 76 54 32",
        email: "martin@example.com",
        notes: "Grand jardin, portail code 1234",
      },
    }),
    prisma.client.create({
      data: {
        jardinierId: jardinier.id,
        nom: "M. Bernard",
        adresse: "5 avenue du Parc",
        codePostal: "31200",
        ville: "Toulouse",
        telephone: "07 11 22 33 44",
      },
    }),
  ]);

  // Prestations du catalogue
  await prisma.prestation.createMany({
    data: [
      {
        jardinierId: jardinier.id,
        nom: "Tonte de pelouse",
        prixUnitaire: 35,
        unite: "heure",
        tauxTVA: 20,
        eligibleCreditImpot: true,
      },
      {
        jardinierId: jardinier.id,
        nom: "Taille de haie",
        prixUnitaire: 40,
        unite: "heure",
        tauxTVA: 20,
        eligibleCreditImpot: true,
      },
      {
        jardinierId: jardinier.id,
        nom: "Débroussaillage",
        prixUnitaire: 45,
        unite: "heure",
        tauxTVA: 20,
        eligibleCreditImpot: true,
      },
    ],
  });

  // Un devis accepté avec 2 lignes
  const devis = await prisma.devis.create({
    data: {
      jardinierId: jardinier.id,
      clientId: clientA.id,
      numero: 1,
      statut: "ACCEPTE",
      objet: "Entretien de printemps",
      lignes: {
        create: [
          { designation: "Tonte de pelouse", quantite: 2, prixUnitaire: 35, tauxTVA: 0, ordre: 0 },
          { designation: "Taille de haie", quantite: 3, prixUnitaire: 40, tauxTVA: 0, ordre: 1 },
        ],
      },
    },
  });

  // La facture issue de ce devis
  await prisma.facture.create({
    data: {
      jardinierId: jardinier.id,
      clientId: clientA.id,
      devisId: devis.id,
      numero: 1,
      statut: "EMISE",
      objet: "Entretien de printemps",
      dateEcheance: addDays(new Date(), 30),
      lignes: {
        create: [
          { designation: "Tonte de pelouse", quantite: 2, prixUnitaire: 35, tauxTVA: 0, ordre: 0 },
          { designation: "Taille de haie", quantite: 3, prixUnitaire: 40, tauxTVA: 0, ordre: 1 },
        ],
      },
    },
  });

  // Interventions au planning
  await prisma.intervention.createMany({
    data: [
      {
        jardinierId: jardinier.id,
        clientId: clientA.id,
        titre: "Tonte + taille de haie",
        date: addDays(new Date(), 2),
        dureeMinutes: 120,
      },
      {
        jardinierId: jardinier.id,
        clientId: clientB.id,
        titre: "Débroussaillage terrain",
        date: addDays(new Date(), 5),
        dureeMinutes: 180,
      },
    ],
  });

  // Une formule + un abonnement + ses 3 prochaines échéances
  const formule = await prisma.formule.create({
    data: {
      jardinierId: jardinier.id,
      nom: "Formule Sérénité",
      description: "2 passages par mois : tonte + entretien général",
      frequence: "BIMENSUELLE",
      prixMensuel: 89,
    },
  });

  await prisma.abonnement.create({
    data: {
      jardinierId: jardinier.id,
      clientId: clientA.id,
      formuleId: formule.id,
      echeances: {
        create: [
          { datePrevue: addDays(new Date(), 7) },
          { datePrevue: addDays(new Date(), 21) },
          { datePrevue: addDays(new Date(), 35) },
        ],
      },
    },
  });

  console.log("Seed terminé — compte démo : demo@findjardinier.fr / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
