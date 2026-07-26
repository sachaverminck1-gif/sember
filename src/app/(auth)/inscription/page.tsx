"use client";

// Page d'inscription jardinier — crée le compte puis connecte automatiquement.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Champ, BoutonPrincipal, MessageErreur } from "@/components/ui";

export default function InscriptionPage() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const form = new FormData(e.currentTarget);
    const donnees = {
      nom: String(form.get("nom") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      entreprise: String(form.get("entreprise") ?? ""),
      telephone: String(form.get("telephone") ?? ""),
      assujettiTVA: form.get("assujettiTVA") === "on",
    };

    const res = await fetch("/api/inscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(donnees),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setErreur(data?.error ?? "Une erreur est survenue");
      setChargement(false);
      return;
    }

    // Connexion automatique après inscription.
    const login = await signIn("credentials", {
      email: donnees.email,
      password: donnees.password,
      redirect: false,
    });

    if (login?.error) {
      setErreur("Compte créé, mais la connexion a échoué. Connectez-vous.");
      setChargement(false);
      router.push("/connexion");
      return;
    }

    router.push("/tableau-de-bord");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-8">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
        Créer mon compte
      </h1>
      <p className="mb-8 text-soft">7 jours d&apos;essai gratuit, sans carte bancaire.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <Champ label="Votre nom *" name="nom" required autoComplete="name" />
        <Champ label="Email *" name="email" type="email" required autoComplete="email" />
        <Champ
          label="Mot de passe * (8 caractères minimum)"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
        />
        <Champ label="Nom de votre entreprise" name="entreprise" autoComplete="organization" />
        <Champ label="Téléphone" name="telephone" type="tel" autoComplete="tel" />

        <label className="flex items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3.5">
          <input
            type="checkbox"
            name="assujettiTVA"
            className="h-5 w-5 shrink-0 accent-[var(--accent)]"
          />
          <span className="text-base text-foreground">
            Je facture la TVA
            <span className="block text-sm text-muted">
              Laissez décoché si vous êtes auto-entrepreneur en franchise de TVA
            </span>
          </span>
        </label>

        <MessageErreur message={erreur} />

        <BoutonPrincipal type="submit" disabled={chargement}>
          {chargement ? "Création en cours…" : "Commencer mon essai gratuit"}
        </BoutonPrincipal>
      </form>

      <p className="mt-8 text-center text-sm text-soft">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-semibold text-accent underline">
          Se connecter
        </Link>
      </p>
    </main>
  );
}
