// Configuration NextAuth v5 — Credentials (email + mot de passe, argon2).
// La session JWT porte l'id du jardinier + les infos d'abonnement nécessaires
// au paywall (plan, statut, fin d'essai) pour éviter une requête DB par page.
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import argon2 from "argon2";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/connexion",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const jardinier = await prisma.jardinier.findUnique({ where: { email } });
        if (!jardinier) return null;

        const valid = await argon2.verify(jardinier.passwordHash, password);
        if (!valid) return null;

        return {
          id: jardinier.id,
          email: jardinier.email,
          name: jardinier.nom,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      // À la connexion, on grave l'id dans le token.
      if (user?.id) token.jardinierId = user.id;
      return token;
    },
    session: async ({ session, token }) => {
      if (token.jardinierId) session.jardinierId = token.jardinierId as string;
      return session;
    },
  },
});
