import { PrismaClient } from "@prisma/client";

// Standarden Prisma "singleton" vzorec za Next.js (prepreči odpiranje
// prevelikega števila povezav na bazo med razvojem zaradi hot-reloada).
// Deluje nespremenjeno tudi po preselitvi iz SQLite na Postgres/MySQL.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
