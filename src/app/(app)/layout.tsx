// Layout de la zone protégée : vérifie la session, affiche la navigation
// mobile-first et la bannière d'état de l'essai / du paywall.
import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { getJardinierOrRedirect } from "@/lib/session";
import { signOut } from "@/lib/auth";
import { Logo } from "@/components/Logo";

const NAV = [
  { href: "/tableau-de-bord", label: "Accueil" },
  { href: "/clients", label: "Clients" },
  { href: "/devis", label: "Devis" },
  { href: "/factures", label: "Factures" },
  { href: "/planning", label: "Planning" },
  { href: "/abonnements", label: "Abos" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { jardinier, lectureSeule } = await getJardinierOrRedirect();

  const joursRestants = differenceInCalendarDays(jardinier.trialEndsAt, new Date());
  const enEssai = jardinier.subscriptionStatus === "TRIAL";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Bannière essai / paywall */}
      {enEssai && (
        <div className="bg-accent-weak px-4 py-2 text-center text-sm text-foreground">
          Essai gratuit — {joursRestants} jour{joursRestants > 1 ? "s" : ""} restant
          {joursRestants > 1 ? "s" : ""}.{" "}
          <Link href="/abonnement-saas" className="font-semibold text-accent underline">
            Choisir ma formule
          </Link>
        </div>
      )}
      {lectureSeule && (
        <div className="bg-red-600 px-4 py-2 text-center text-sm font-semibold text-white">
          Essai terminé — vos données sont conservées.{" "}
          <Link href="/abonnement-saas" className="underline">
            Abonnez-vous pour continuer
          </Link>
        </div>
      )}

      {/* En-tête */}
      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3">
        <Link href="/tableau-de-bord" aria-label="Sember — accueil">
          <Logo className="text-lg" />
        </Link>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/connexion" });
          }}
        >
          <button className="text-sm text-muted transition hover:text-foreground">
            Déconnexion
          </button>
        </form>
      </header>

      {/* Contenu */}
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 pb-24">{children}</main>

      {/* Navigation basse, style app mobile — atteignable au pouce */}
      <nav className="fixed inset-x-0 bottom-0 border-t border-line bg-surface">
        <div className="mx-auto flex max-w-3xl justify-between px-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-w-0 flex-1 px-1 py-3 text-center text-[11px] font-medium text-soft transition hover:text-accent"
            >
              <span className="block truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
