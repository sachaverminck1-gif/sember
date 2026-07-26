"use client";

// Page de connexion jardinier.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Champ, BoutonPrincipal, MessageErreur } from "@/components/ui";

export default function ConnexionPage() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const form = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
      redirect: false,
    });

    if (res?.error) {
      setErreur("Email ou mot de passe incorrect");
      setChargement(false);
      return;
    }

    router.push("/tableau-de-bord");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-8">
      <h1 className="mb-8 text-3xl font-semibold tracking-tight text-foreground">
        Se connecter
      </h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <Champ label="Email" name="email" type="email" required autoComplete="email" />
        <Champ
          label="Mot de passe"
          name="password"
          type="password"
          required
          autoComplete="current-password"
        />

        <MessageErreur message={erreur} />

        <BoutonPrincipal type="submit" disabled={chargement}>
          {chargement ? "Connexion…" : "Se connecter"}
        </BoutonPrincipal>
      </form>

      <p className="mt-8 text-center text-sm text-soft">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-accent underline">
          Essai gratuit 7 jours
        </Link>
      </p>
    </main>
  );
}
