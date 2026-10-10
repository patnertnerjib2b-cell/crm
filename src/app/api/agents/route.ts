import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Glej komentar v src/app/api/overview/route.ts - enak razlog.
export const dynamic = "force-dynamic";

export async function GET() {
  const agents = await prisma.agent.findMany({
    orderBy: [{ active: "desc" }, { firstName: "asc" }, { lastName: "asc" }],
  });
  return NextResponse.json({
    agents: agents.map((a) => ({
      id: a.id,
      firstName: a.firstName,
      lastName: a.lastName,
      active: a.active,
    })),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const firstName = (body?.firstName ?? "").toString().trim();
  const lastName = (body?.lastName ?? "").toString().trim();

  if (!firstName) {
    return NextResponse.json(
      { error: "Ime je obvezno polje." },
      { status: 400 }
    );
  }

  const agent = await prisma.agent.create({
    data: { firstName, lastName },
  });

  return NextResponse.json({ agent }, { status: 201 });
}
