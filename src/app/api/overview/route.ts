import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getWeekRange } from "@/lib/week";
import { CONTACT_STATUSES, SUCCESS_STATUSES } from "@/types/contact";

// Splošna statistika za admin nadzorno ploščo: stanje baze kontaktov po
// statusih, število agentov in skupno število klicev v tekočem tednu.
export async function GET() {
  const { start, end } = getWeekRange();

  const [totalContacts, statusCounts, totalAgents, activeAgents, weekLogs] =
    await Promise.all([
      prisma.contact.count(),
      Promise.all(
        CONTACT_STATUSES.map(async (status) => ({
          status,
          count: await prisma.contact.count({ where: { status } }),
        }))
      ),
      prisma.agent.count(),
      prisma.agent.count({ where: { active: true } }),
      prisma.callLog.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: { status: true },
      }),
    ]);

  const weekTotalCalls = weekLogs.length;
  const weekSuccessfulCalls = weekLogs.filter((l) =>
    SUCCESS_STATUSES.includes(l.status as (typeof SUCCESS_STATUSES)[number])
  ).length;

  return NextResponse.json({
    totalContacts,
    statusCounts,
    totalAgents,
    activeAgents,
    weekTotalCalls,
    weekSuccessfulCalls,
  });
}
