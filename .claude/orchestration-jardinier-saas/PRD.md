# Find-Jardinier - Product Requirements Document

**Created**: 2026-07-26
**Status**: Draft
**Source**: User brain dump (pitch SaaS jardiniers + marketplace)

---

## 1. Vision

Find-Jardinier est un SaaS B2B à revenus récurrents (MRR) destiné aux **jardiniers
indépendants en France**. Le produit principal est un logiciel de gestion d'activité :
devis, factures, carnet clients, planning des interventions et gestion d'abonnements
d'entretien récurrents. L'objectif « jour 1 » est d'apporter de la valeur immédiate au
jardinier pour gérer ses clients existants — même sans aucun trafic entrant sur la
plateforme.

Le problème résolu est double. Côté jardinier : il est noyé sous l'administratif (devis
sur un coin de table, relances oubliées, factures en retard, planning dans la tête,
crédit d'impôt mal géré). Côté particulier : il cherche un jardinier de confiance près
de chez lui, pour un besoin qui paraît ponctuel mais qui est en réalité récurrent.

La stratégie long terme empile trois couches de MRR : (1) l'abonnement SaaS du jardinier
[cœur], (2) l'abonnement d'entretien récurrent côté client avec commission plateforme,
(3) le paiement + l'avance de crédit d'impôt comme fossé défensif anti-désintermédiation.
Une marketplace géolocalisée sert d'appât pour remplir le SaaS, mais elle vient **après**
le cœur métier. **Ce document et ce premier chantier ne couvrent que le MVP du cœur SaaS.**

## 2. Core Features

### MVP — Cœur SaaS jardinier (ce qui est construit maintenant)
- Inscription / connexion jardinier (email + mot de passe).
- Tableau de bord jardinier (vue d'ensemble de l'activité).
- Gestion des clients : carnet d'adresses simple (CRUD).
- Devis : création, édition, export PDF téléchargeable.
- Factures : création, édition, export PDF téléchargeable.
- Planning des interventions : vue calendrier.
- Abonnements d'entretien récurrents : créer une formule, l'assigner à un client,
  visualiser les échéances.
- Isolation stricte des données : un jardinier ne voit jamais les données d'un autre.
- Interface mobile-first, simple, gros boutons (usage terrain).

### Phase 2 — Hors périmètre MVP (conçu mais pas construit)
- Carte publique géolocalisée des jardiniers actifs et notés.
- Profils publics + avis clients.
- Messagerie privée client ↔ jardinier.
- Paiement en ligne sécurisé.
- Avance immédiate du crédit d'impôt (URSSAF services à la personne).
- Souscription des abonnements d'entretien côté particulier + commission.

## 3. User Flows

### Flow 1 : Onboarding jardinier
1. Le jardinier s'inscrit (email + mot de passe).
2. Il complète un profil minimal (nom, entreprise/statut, zone).
3. Il arrive sur son tableau de bord vide avec des appels à l'action clairs
   (« Ajouter un client », « Créer un devis »).

### Flow 2 : Créer un devis puis une facture
1. Le jardinier sélectionne ou crée un client.
2. Il crée un devis (lignes de prestation, quantités, prix, TVA).
3. Il télécharge/le PDF ; le devis passe en statut « envoyé » puis « accepté ».
4. Depuis un devis accepté, il génère une facture (report des lignes).
5. Il télécharge la facture en PDF.

### Flow 3 : Planifier une intervention
1. Le jardinier ouvre le calendrier.
2. Il crée une intervention (client, date/heure, type de prestation, notes).
3. L'intervention apparaît dans la vue calendrier.

### Flow 4 : Gérer un abonnement d'entretien
1. Le jardinier crée une formule (nom, fréquence, prix mensuel, prestations incluses).
2. Il assigne la formule à un client.
3. Le système affiche les échéances/passages à venir pour cet abonnement.

## 4. Technical Signals

- Frontend : Next.js (App Router) + TypeScript + Tailwind CSS.
- Backend : API routes Next.js.
- Base de données : PostgreSQL via Prisma (schéma complet fourni).
- Auth : NextAuth (ou équivalent simple et sécurisé).
- Déploiement visé : Vercel, code prêt à déployer.
- Génération PDF (devis/factures) à trancher (librairie côté serveur).
- Métier nommé en français (devis, facture, abonnement), technique en anglais.
- Modèle de données prévoyant dès maintenant les champs futurs du crédit d'impôt.

## 5. Open Questions

Ces points seront résolus en phase Discovery (grillés un par un) :

- Base de données : Postgres hébergé où (Neon, Supabase, Vercel Postgres) ?
- Auth : NextAuth v5 avec Credentials suffit-il, ou besoin d'OAuth Google ?
- PDF : quelle librairie / quel niveau de personnalisation (logo, mentions légales) ?
- TVA et statuts juridiques (auto-entrepreneur non assujetti vs assujetti) : gérés comment ?
- Devis → facture : numérotation légale (séquentielle, non trous) obligatoire ?
- Multi-langue nécessaire ? (a priori non, FR only)
- Y a-t-il déjà des jardiniers pilotes / une ville cible identifiée ?
- Validation marché : des jardiniers ont-ils confirmé qu'ils paieraient ?
- Charte visuelle / nom de marque / logo existants ?
- Quel périmètre exact pour les « échéances » d'abonnement (génération auto de factures ?) ?

## 6. Explicit Constraints

- **NE PAS construire dans le MVP** : carte publique, messagerie, paiement en ligne,
  crédit d'impôt (implémentation), souscription côté particulier.
- Stack imposée (voir section 4) — tout écart doit être justifié avant de coder.
- Pas de code fictif ni de TODO : chaque fonctionnalité livrée doit fonctionner réellement.
- Isolation stricte des données entre jardiniers (multi-tenant sécurisé).
- Mobile-first obligatoire.

## 6bis. Build Method & Non-Negotiable Constraints (autorité)

Méthode de travail imposée par l'utilisateur — s'applique à toutes les phases :

- **Plan d'abord, code ensuite** : présenter plan + arborescence, ATTENDRE validation avant de coder.
- **Ordre de construction strict** : (1) schéma de données, (2) auth, (3) clients,
  (4) devis/factures, (5) planning, (6) abonnements.
- **Chaque étape livrable et testable** : code complet + comment le tester + quoi vérifier.
- **Zéro code fictif, zéro TODO** : chaque fonctionnalité livrée fonctionne réellement.
- **Écart de stack interdit sans justification préalable.**

Contraintes qualité non négociables :

- Code propre, commenté aux endroits non évidents ; métier en français, technique en anglais.
- Sécurité : validation des entrées, routes protégées, aucune donnée sensible en clair,
  isolation stricte multi-tenant (un jardinier ne voit JAMAIS les données d'un autre).
- Responsive mobile-first (usage terrain sur téléphone).
- UI simple et sobre : gros boutons, peu de clics, pour un public peu à l'aise avec l'informatique.
- Gestion explicite des cas d'erreur (champs vides, facture sans client, etc.).

Livrables finaux attendus :

- Code source complet et organisé + schéma de base de données.
- README : installation, lancement local, variables d'environnement, déploiement Vercel.
- Liste claire du reste-à-faire phase 2 (carte, messagerie, paiement, crédit d'impôt).

## 7. Success Criteria

- Un jardinier peut s'inscrire, se connecter et voir uniquement ses données.
- Il peut créer un client, un devis, le convertir en facture, et exporter les deux en PDF.
- Il peut planifier une intervention et la voir au calendrier.
- Il peut créer une formule d'abonnement, l'assigner à un client, voir les échéances.
- L'application est déployable sur Vercel via le README fourni.
- Le schéma Prisma prévoit les champs nécessaires au crédit d'impôt (phase 2).
- Aucune fuite de données inter-jardiniers (vérifiée par test).
