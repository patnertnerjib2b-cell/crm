import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { addWeeks, formatWeekLabel, getWeekRange } from "@/lib/week";
import { SUCCESS_STATUSES, type LeaderboardRow } from "@/types/contact";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const weekOffset = parseInt(searchParams.get("weekOffset") ?? "0", 10) || 0;

  const referenceDate = addWeeks(new Date(), weekOffset);
  const { start, end } = getWeekRange(referenceDate);

  const [agents, logs] = await Promise.all([
    prisma.agent.findMany({
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    }),
    prisma.callLog.findMany({
      where: { createdAt: { gte: start, lt: end } },
      select: { agentId: true, status: true },
    }),
  ]);

  const statsByAgent = new Map<string, { total: number; success: number }>();
  for (const agent of agents) {
    statsByAgent.set(agent.id, { total: 0, success: 0 });
  }

  for (const log of logs) {
    const entry = statsByAgent.get(log.agentId);
    if (!entry) continue; // agent je bil medtem izbrisan
    entry.total += 1;
    if (SUCCESS_STATUSES.includes(log.status as (typeof SUCCESS_STATUSES)[number])) {
      entry.success += 1;
    }
  }

  const rowsUnranked = agents
    .filter((a) => a.active || (statsByAgent.get(a.id)?.total ?? 0) > 0)
    .map((agent) => {
      const stats = statsByAgent.get(agent.id) ?? { total: 0, success: 0 };
      return {
        agentId: agent.id,
        agentName: `${agent.firstName} ${agent.lastName}`.trim(),
        totalCalls: stats.total,
        successfulCalls: stats.success,
      };
    })
    .sort((a, b) => {
      if (b.totalCalls !== a.totalCalls) return b.totalCalls - a.totalCalls;
      if (b.successfulCalls !== a.successfulCalls)
        return b.successfulCalls - a.successfulCalls;
      return a.agentName.localeCompare(b.agentName, "sl");
    });

  const rows: LeaderboardRow[] = rowsUnranked.map((r, i) => ({
    ...r,
    rank: i + 1,
  }));

  return NextResponse.json({
    weekOffset,
    weekLabel: formatWeekLabel(start, end),
    start,
    end,
    isCurrentWeek: weekOffset === 0,
    rows,
    teamTotals: {
      totalCalls: rows.reduce((s, r) => s + r.totalCalls, 0),
      successfulCalls: rows.reduce((s, r) => s + r.successfulCalls, 0),
    },
  });
}
