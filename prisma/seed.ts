/**
 * Osnovni seed skript - doda nekaj začetnih agentov in nekaj primerov
 * kontaktov, da je aplikacijo takoj po namestitvi mogoče preizkusiti.
 *
 * Zagon: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const agentNames: Array<[string, string]> = [
    ["Luka", "Novak"],
    ["Tim", "Kovač"],
    ["Aljaž", "Horvat"],
  ];

  for (const [firstName, lastName] of agentNames) {
    const existing = await prisma.agent.findFirst({
      where: { firstName, lastName },
    });
    if (!existing) {
      await prisma.agent.create({ data: { firstName, lastName } });
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
