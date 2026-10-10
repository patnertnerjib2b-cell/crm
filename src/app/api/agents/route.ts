import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest, hashPassword } from "@/lib/auth";

// Glej komentar v src/app/api/overview/route.ts - enak razlog.
export const dynamic = "force-dynamic";

// Upravljanje agentov (uporabniških računov) je dovoljeno samo adminom.
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Dostop zavrnjen." }, { status: 403 });
  }

  const agents = await prisma.agent.findMany({
    orderBy: [{ active: "desc" }, { firstName: "asc" }, { lastName: "asc" }],
  });
  return NextResponse.json({
    agents: agents.map((a) => ({
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      username: a.username,
      isAdmin: a.isAdmin,
      active: a.active,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Dostop zavrnjen." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const firstName = (body?.firstName ?? "").toString().trim();
  const lastName = (body?.lastName ?? "").toString().trim();
  const username = (body?.username ?? "").toString().trim().toLowerCase();
  const password = (body?.password ?? "").toString();
  const isAdmin = Boolean(body?.isAdmin);

  if (!firstName) {
    return NextResponse.json(
      { error: "Ime je obvezno polje." },
      { status: 400 }
    );
  }
  if (!username) {
    return NextResponse.json(
      { error: "Uporabniško ime je obvezno polje." },
      { status: 400 }
    );
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "Geslo mora imeti vsaj 6 znakov." },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await hashPassword(password);
    const agent = await prisma.agent.create({
      data: { firstName, lastName, username, passwordHash, isAdmin },
    });
    return NextResponse.json(
      {
        agent: {
          id: agent.id,
          firstName: agent.firstName,
          lastName: agent.lastName,
          username: agent.username,
          isAdmin: agent.isAdmin,
          active: agent.active,
        },
      },
      { status: 201 }
    );
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
    return NextResponse.json(
      { error: "Napaka pri ustvarjanju agenta." },
      { status: 500 }
    );
  }
}
