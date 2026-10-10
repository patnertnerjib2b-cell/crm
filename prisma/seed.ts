/**
 * Osnovni seed skript - doda začetne agente (prave uporabniške račune) in
 * nekaj primerov kontaktov, da je aplikacijo takoj po namestitvi mogoče
 * preizkusiti. Teče samodejno ob vsakem "npm run build" (glej
 * package.json), zato je nujno idempotenten - obstoječih agentov (po
 * uporabniškem imenu) ne spremeni ali podvoji.
 *
 * Gesla so tu shranjena izključno kot bcrypt hash - pravo (začetno) geslo
 * je bilo sporočeno administratorju ob vzpostavitvi ob prvi namestitvi.
 * Spremenite ga lahko v Admin → Agenti ("Novo geslo").
 *
 * Zagon: npm run db:seed (ali samodejno ob "npm run build")
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const agents: Array<{
    firstName: string;
    lastName: string;
    username: string;
    isAdmin: boolean;
    passwordHash: string;
  }> = [
    {
      firstName: "Nik",
      lastName: "Ribič",
      username: "nik.ribic",
      isAdmin: false,
      passwordHash: "$2b$10$kZZvI0wzlxqYmU7tuCEk9.W0IRjo3UE8svSf4MgA7vKp3gLy7AHwW",
    },
    {
      firstName: "Tim",
      lastName: "Makovec",
      username: "tim.makovec",
      isAdmin: false,
      passwordHash: "$2b$10$LUiNuKkXLsyka3E9NRmua.LOxWi5eQaYNCLXklmaQ0ZRoDJfIjFaW",
    },
    {
      firstName: "Luka",
      lastName: "Dolinšek",
      username: "luka.dolinsek",
      isAdmin: true,
      passwordHash: "$2b$10$jHetYTljfyjvYK6Y5iq9u.daS6CGGVzti3Cbzqbgp9xhNZ1VU5vfK",
    },
    {
      firstName: "Luka",
      lastName: "Hiršel",
      username: "luka.hirsel",
      isAdmin: false,
      passwordHash: "$2b$10$zVsMynhISpgr7rIZ.Eur6O1N.pzBmBMuN2x1v8bpfcRHvf0em1xHK",
    },
    {
      firstName: "Tilen",
      lastName: "Lužnik",
      username: "tilen.luznik",
      isAdmin: false,
      passwordHash: "$2b$10$GFOuE5a/Q4btEWqZfOUvF.Ud6KZPJGGxJODf57vEXnwXDy31Bw.42",
    },
    {
      firstName: "Jan",
      lastName: "Kobav",
      username: "jan.kobav",
      isAdmin: false,
      passwordHash: "$2b$10$/bEtPFw7OHBgXIX9nF4QSu6mEwdLE8mttRfv38kXdufj.jNc6fWGO",
    },
    {
      firstName: "Aljaž",
      lastName: "Rokavec",
      username: "aljaz.rokavec",
      isAdmin: true,
      passwordHash: "$2b$10$VAkK3Xe15QVHtoOdnEYX3.1JesIQONDGcaf1Pk3Q8D8V.J47ySUbm",
    },
  ];

  for (const agent of agents) {
    const existing = await prisma.agent.findUnique({
      where: { username: agent.username },
    });
    if (!existing) {
      await prisma.agent.create({ data: agent });
    }
  }

  const contactCount = await prisma.contact.count();
  if (contactCount === 0) {
    await prisma.contact.createMany({
      data: [
        {
          firstName: "Janez",
          lastName: "Kranjc",
          company: "Kranjc Gradnje d.o.o.",
          phone: "+386 31 123 456",
          email: "janez.kranjc@example.com",
          notes: "Zanima ga ponudba za avtomatizacijo.",
          status: "NEW",
        },
        {
          firstName: "Maja",
          lastName: "Zupan",
          company: "Zupan Consulting",
          phone: "+386 41 222 333",
          email: "maja.zupan@example.com",
          status: "NEW",
        },
        {
          firstName: "Peter",
          lastName: "Kos",
          company: "Kos Logistika",
          phone: "+386 51 999 888",
          email: "peter.kos@example.com",
          notes: "Poskusil poklicati - brez odziva.",
          status: "NO_ANSWER",
        },
      ],
    });
  }

  console.log("Seed končan.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
