import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

// Glej komentar v src/app/api/overview/route.ts - enak razlog.
export const dynamic = "force-dynamic";

// Admin akcija: masovno dodeli podan seznam obstoječih kontaktov enemu
// agentu (njegov osebni seznam za klicanje). Uporabljeno predvsem
// enkratno, retroaktivno - za kontakte, uvožene PRED uvedbo dodeljevanja
// po agentih.
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Dostop zavrnjen." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const agentId = (body?.agentId ?? "").toString().trim();
  const contactIds = Array.isArray(body?.contactIds) ? (body.contactIds as string[]) : [];

  if (!agentId || contactIds.length === 0) {
    return NextResponse.json(
      { error: "Potrebna sta agentId in neprazen seznam contactIds." },
      { status: 400 }
    );
  }

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    return NextResponse.json({ error: "Agent ne obstaja." }, { status: 400 });
  }

  const result = await prisma.contact.updateMany({
    where: { id: { in: contactIds } },
    data: { assignedAgentId: agentId },
  });

  return NextResponse.json({ assigned: result.count });
}
