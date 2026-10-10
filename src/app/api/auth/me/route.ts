import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ agent: null }, { status: 401 });
  }

  const agent = await prisma.agent.findUnique({ where: { id: session.agentId } });
  if (!agent || !agent.active) {
    return NextResponse.json({ agent: null }, { status: 401 });
  }

  return NextResponse.json({
    agent: {
      id: agent.id,
      firstName: agent.firstName,
      lastName: agent.lastName,
      isAdmin: agent.isAdmin,
    },
  });
}
