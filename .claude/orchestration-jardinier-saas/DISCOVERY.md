# DISCOVERY.md — Find-Jardinier (autorité des décisions)

Document faisant autorité. Chaque décision est numérotée (D1, D2…) pour référence.

---

## Lot 1 — Décisions structurantes

### D1 — Hébergement base de données
**Décision : Neon** (Postgres serverless, intégration native Vercel, gratuit pour démarrer).
- Prisma pointe sur Neon en prod, Postgres local (ou Neon dev branch) en développement.

### D2 — TVA / statut juridique
**Décision : gérer les deux cas (avec et sans TVA).**
- Chaque jardinier a un réglage : franchise en base de TVA (auto-entrepreneur) OU assujetti.
- Si franchise : factures sans TVA + mention légale « TVA non applicable, art. 293 B du CGI ».
- Si assujetti : TVA paramétrable par ligne (taux 0 / 10 / 20 %), totaux HT / TVA / TTC.
- Le modèle de données porte le taux de TVA au niveau de la ligne de devis/facture.

### D3 — Authentification
**Décision : email + mot de passe uniquement** (NextAuth Credentials, hash bcrypt/argon2).
- Pas d'OAuth Google dans le MVP (reporté phase 2 si besoin).

### D4 — Abonnements d'entretien (portée MVP)
**Décision : affichage des échéances seulement.**
- Créer une formule (nom, fréquence, prix mensuel, prestations incluses).
- Assigner à un client, afficher les prochaines échéances/passages.
- PAS de génération automatique de factures dans le MVP (reporté).

### D5 — Essai gratuit 7 jours + paywall (NOUVELLE EXIGENCE)
**Intention utilisateur :** chaque jardinier bénéficie de 7 jours d'essai. À l'expiration,
il doit payer pour continuer à accéder à ses données (verrou anti-churn : ses données
« devis, clients, planning » deviennent la raison de payer).
**À trancher (voir lot 2) :** faut-il intégrer un vrai paiement (Stripe) dès le MVP pour
permettre la conversion, ou seulement construire le verrou d'expiration (compte bloqué en
lecture seule / accès coupé) et brancher le paiement en phase 2 ?
**Tension :** le périmètre MVP excluait explicitement « paiement en ligne ». Cette exigence
réintroduit potentiellement un paiement — d'où l'arbitrage nécessaire.

---

---

## Lot 2 — Essai, paywall, paiement

### D6 — Fin d'essai / paiement
**Décision : Stripe dès le MVP.**
- Chaque jardinier démarre avec 7 jours d'essai (aucune CB requise à l'inscription — à confirmer).
- À J+7 sans abonnement actif : compte **bloqué en lecture seule** (données conservées,
  consultation possible, mais création/édition désactivée) jusqu'au paiement.
- Stripe Billing gère l'abonnement du jardinier à SON SaaS (distinct du paiement
  client→jardinier, qui reste en phase 2).
- MVP en **Stripe test mode** ; passage en live au déploiement.

### D7 — Plans d'abonnement
**Décision utilisateur : 3 plans (19/49/99 €).**
**⚠️ Problème identifié (à trancher, lot 2b) :** les différenciateurs des plans (paiement
client, crédit d'impôt, carte, avis, mini-site, stats) sont presque tous en phase 2. Dans
le MVP, les 3 plans seraient fonctionnellement identiques → intenable.
**Proposition de différenciation MVP (par quotas, pas par features phase 2) :**
- Starter 19 € : jusqu'à 15 clients, devis/factures/planning, 1 utilisateur.
- Pro 49 € : clients illimités, relances/rappels, export compta, 1 utilisateur.
- Business 99 € : tout Pro + multi-employés (plusieurs comptes sous une entreprise) + stats.
Ainsi chaque palier apporte une valeur réelle dès le MVP, et les features phase 2
viendront enrichir les paliers plus tard sans casser la grille.

---

### D8 — Différenciation des plans (MVP) — CONFIRMÉ
**Décision : différenciation par quotas.**
- Starter 19 € : 15 clients max, 1 utilisateur, devis/factures/planning/abonnements.
- Pro 49 € : clients illimités + relances/rappels + export comptable, 1 utilisateur.
- Business 99 € : tout Pro + multi-employés (plusieurs comptes sous une même entreprise) + stats.
- Le gating se fait sur ces quotas ; les features phase 2 enrichiront les paliers plus tard.

### D9 — Essai 7 jours — CONFIRMÉ
**Décision : essai sans carte bancaire à l'inscription.**
- Inscription libre → 7 jours d'accès complet → à J+7 sans abo : compte en lecture seule.
- Demande de CB (Stripe) au moment de convertir, pas avant.

### D10 — Conformité des factures (MVP) — CONFIRMÉ
**Décision : version simple, conformité légale complète reportée.**
- PDF simple et lisible. On conserve tout de même une numérotation séquentielle basique
  (peu coûteuse, évite des ennuis) et la mention « TVA non applicable, art. 293 B du CGI »
  pour les jardiniers en franchise (car D2 impose de gérer les deux cas de TVA).
- Mentions légales exhaustives (SIRET obligatoire, etc.) et garanties anti-trou : phase 2.

---

## Risque ouvert (non bloquant) — Validation marché
L'utilisateur choisit de construire avant d'avoir une validation formelle (aucun jardinier
pilote confirmé à ce stade). Risque assumé : on peut construire un excellent produit que
personne n'achète. Recommandation maintenue : décrocher 5–10 jardiniers d'une ville cible
en parallèle du build. NON bloquant pour le développement.

---

## Statut Discovery : COMPLET pour le MVP
Un agent d'exécution pourrait implémenter le MVP à partir de ce document sans deviner sur
les points structurants. Détails fins (schéma exact, endpoints) seront figés dans le PLAN.
