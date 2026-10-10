import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};

  if (typeof body?.firstName === "string" && body.firstName.trim()) {
    data.firstName = body.firstName.trim();
  }
  if (typeof body?.lastName === "string") {
    data.lastName = body.lastName.trim();
  }
  if (typeof body?.active === "boolean") {
    data.active = body.active;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Ni podatkov za posodobitev." }, { status: 400 });
  }

  try {
    const agent = await prisma.agent.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({ agent });
  } catch {
    return NextResponse.json({ error: "Agent ne obstaja." }, { status: 404 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const callCount = await prisma.callLog.count({
    where: { agentId: params.id },
  });

  if (callCount === 0) {
    // Varno za trajni izbris - agent nima zgodovine klicev.
    try {
      await prisma.agent.delete({ where: { id: params.id } });
    } catch {
      return NextResponse.json({ error: "Agent ne obstaja." }, { status: 404 });
    }
    return NextResponse.json({ deleted: true, soft: false });
  }

  // Agent ima že zabeležene klice - da ne izgubimo zgodovine na
  // leaderboardu, ga samo deaktiviramo (ne bo več na seznamu za izbiro).
  try {
    await prisma.agent.update({
      where: { id: params.id },
      data: { active: false },
    });
  } catch {
    return NextResponse.json({ error: "Agent ne obstaja." }, { status: 404 });
  }
  return NextResponse.json({ deleted: true, soft: true });
}
