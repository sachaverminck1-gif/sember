// Extension des types NextAuth : la session porte l'id du jardinier connecté.
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session extends DefaultSession {
    jardinierId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    jardinierId?: string;
  }
}
