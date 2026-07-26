# Sember

Le logiciel qui fait tourner l'activité des jardiniers indépendants : devis,
factures PDF, planning, clients et abonnements d'entretien récurrents.
SaaS multi-tenant avec essai gratuit de 7 jours puis abonnement mensuel
(Starter 19 € / Pro 49 € / Business 99 €).

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind CSS 4
- **PostgreSQL** (Neon) via **Prisma 7** (driver adapter `pg`)
- **NextAuth v5** (credentials, JWT) + argon2
- **@react-pdf/renderer** pour les devis/factures PDF
- **Stripe** pour l'abonnement SaaS (optionnel en dev)
- Déploiement : **Vercel**

## Installation

```bash
npm install
cp .env.example .env      # puis remplir les valeurs (voir ci-dessous)
npx prisma migrate dev    # crée les tables
npx prisma db seed        # données de démo (compte : demo@findjardinier.fr / demo1234)
npm run dev               # http://localhost:3000
```

### Variables d'environnement

Voir [.env.example](.env.example) pour le détail. En résumé :

| Variable | Rôle | Obligatoire |
|---|---|---|
| `DATABASE_URL` | Postgres avec pooler (l'app) | Oui |
| `DIRECT_URL` | Postgres direct sans pooler (migrations) | Oui avec Neon |
| `AUTH_SECRET` | Signature des sessions JWT | Oui |
| `AUTH_TRUST_HOST` | `true` en local et sur Vercel | Oui |
| `STRIPE_*` | Paiement de l'abonnement SaaS | Non (mode dégradé) |

Sans les clés Stripe, l'application fonctionne entièrement ; seuls les boutons
de paiement sont remplacés par « le paiement arrive bientôt ».

## Architecture

```
src/
├── app/
│   ├── (auth)/            # connexion, inscription (public)
│   ├── (app)/             # zone protégée (session requise)
│   │   ├── tableau-de-bord/
│   │   ├── clients/       # carnet clients (CRUD)
│   │   ├── devis/         # devis + PDF + conversion en facture
│   │   ├── factures/      # factures + PDF + cycle de vie
│   │   ├── planning/      # calendrier mensuel des interventions
│   │   ├── abonnements/   # formules d'entretien + échéances
│   │   └── abonnement-saas/  # plans + paiement Stripe
│   └── api/               # routes API (toutes filtrées par jardinier)
├── components/            # UI (design system Sember) + formulaires
├── lib/
│   ├── auth.ts            # NextAuth v5
│   ├── session.ts         # garde de session + paywall (POINT D'ENTRÉE OBLIGATOIRE)
│   ├── prisma.ts          # client Prisma (adapter pg, pool durci pour Neon)
│   ├── montants.ts        # calculs en centimes entiers (jamais de flottants)
│   ├── numerotation.ts    # numéros séquentiels légaux (devis/factures)
│   ├── echeances.ts       # génération des passages d'abonnement
│   ├── quotas.ts          # limites par plan (Starter : 15 clients)
│   ├── stripe.ts          # client Stripe + mapping plans
│   ├── pdf/DocumentPDF.tsx  # rendu PDF devis/factures
│   └── validation/        # schémas zod par domaine
└── proxy.ts               # protection des routes (ex-middleware)
```

### Règles métier importantes

- **Multi-tenant strict** : toute requête part du `jardinierId` de session
  (`getJardinierOrRedirect` / `getJardinierForApi`). Jamais d'ID venant du client.
- **Argent en centimes entiers** : `src/lib/montants.ts`. La TVA est calculée
  par taux sur bases cumulées (conformité des récapitulatifs).
- **Numérotation légale** : séquentielle par jardinier, sans trou. Une facture
  émise ne peut être ni modifiée ni supprimée — seulement annulée.
- **TVA** : jardinier en franchise (art. 293 B) → taux forcés à 0 et mention
  légale sur le PDF ; assujetti → taux 0/10/20 % par ligne.
- **Essai 7 jours** : à l'inscription, `trialEndsAt = +7 j`. Expiré sans
  abonnement → statut `LOCKED` : lecture seule, données conservées (les écrans
  d'écriture renvoient 403 et l'UI incite à s'abonner).

## Stripe (activer le paiement)

1. Créer 3 produits mensuels dans le dashboard (19/49/99 €), copier les
   `price_...` dans `.env`.
2. `stripe listen --forward-to localhost:3000/api/stripe/webhook` en dev ;
   copier le `whsec_...`.
3. Webhooks écoutés : `checkout.session.completed`,
   `customer.subscription.updated`, `invoice.payment_failed`,
   `customer.subscription.deleted`.

## Déploiement sur Vercel

1. Pousser le repo sur GitHub et l'importer dans Vercel.
2. Renseigner les variables d'environnement (tableau ci-dessus) dans
   *Project Settings → Environment Variables*.
3. Build command par défaut (`next build`).
4. Appliquer le schéma en production : `npx prisma migrate deploy` (en CI ou
   localement avec le `DIRECT_URL` de prod).
5. Configurer le webhook Stripe de prod vers
   `https://votre-domaine/api/stripe/webhook`.

## Reste à faire — Phase 2

Dans l'ordre de valeur métier :

1. **Avance immédiate du crédit d'impôt (URSSAF SAP)** — le fossé défensif.
   Les champs sont déjà prévus au schéma (`eligibleCreditImpot`, `categorieSAP`
   sur `Prestation`).
2. **Paiement en ligne des factures clients** (Stripe Connect ou virement).
3. **Carte publique géolocalisée** des jardiniers + profils publics + avis.
4. **Messagerie** client ↔ jardinier.
5. **Relances automatiques** des factures impayées (plan Pro).
6. **Export comptable** (plan Pro) et **multi-employés + stats** (plan Business).
7. Emails transactionnels (bienvenue, fin d'essai, échéances à venir).
8. Suppression du compte + export RGPD.
