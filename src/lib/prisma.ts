// Singleton Prisma Client (évite d'épuiser les connexions en dev avec le HMR).
// Prisma 7 : adapter de driver explicite (pg → PostgreSQL/Neon).
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const createClient = () => {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
    // Neon (serverless) peut mettre quelques secondes à sortir de veille :
    // on laisse le temps à la connexion de s'établir au lieu d'échouer en ETIMEDOUT.
    connectionTimeoutMillis: 15000,
    max: 5,
  });
  return new PrismaClient({ adapter });
};

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
