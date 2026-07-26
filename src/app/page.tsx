// Page d'accueil publique — pitch minimal + entrées inscription/connexion.
import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function AccueilPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <span className="badge mb-6 self-start">Pour les jardiniers indépendants</span>

      <h1 className="mb-3 text-4xl">
        <Logo className="text-4xl" />
      </h1>
      <p className="mb-10 text-lg text-soft">
        Devis, factures, planning et abonnements d&apos;entretien. Le logiciel qui
        fait tourner votre activité.
      </p>

      <div className="space-y-3">
        <Link
          href="/inscription"
          className="block rounded-lg bg-accent px-6 py-4 text-center text-base font-semibold text-on-accent transition hover:bg-accent-hover"
        >
          Essai gratuit 7 jours
        </Link>
        <Link
          href="/connexion"
          className="block rounded-lg border border-line bg-surface px-6 py-4 text-center text-base font-semibold text-foreground transition hover:border-muted"
        >
          Se connecter
        </Link>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Sans carte bancaire. Sans engagement.
      </p>
    </main>
  );
}
