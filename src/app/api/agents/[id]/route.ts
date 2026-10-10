import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Dostop zavrnjen." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};

  if (typeof body?.firstName === "string" && body.firstName.trim()) {
    data.firstName = body.firstName.trim();
  }
  if (typeof body?.lastName === "string") {
    data.lastName = body.lastName.trim();
  }
  if (typeof body?.username === "string" && body.username.trim()) {
    data.username = body.username.trim().toLowerCase();
  }
  if (typeof body?.isAdmin === "boolean") {
    data.isAdmin = body.isAdmin;
  }
  if (typeof body?.active === "boolean") {
    data.active = body.active;
  }
  if (typeof body?.password === "string" && body.password.length > 0) {
    if (body.password.length < 6) {
      return NextResponse.json(
        { error: "Geslo mora imeti vsaj 6 znakov." },
        { status: 400 }
      );
    }
    data.passwordHash = await hashPassword(body.password);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Ni podatkov za posodobitev." }, { status: 400 });
  }

  try {
    const agent = await prisma.agent.update({
      where: { id: params.id },
      data,
    });
    return NextResponse.json({
      agent: {
        id: agent.id,
        firstName: agent.firstName,
        lastName: agent.lastName,
        username: agent.username,
        isAdmin: agent.isAdmin,
        active: agent.active,
      },
    });
  } catch (e: unknown) {
    if (
      typeof e === "object" &&
      e &&
      "code" in e &&
      (e as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Uporabniško ime že obstaja." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Agent ne obstaja." }, { status: 404 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Dostop zavrnjen." }, { status: 403 });
  }

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
