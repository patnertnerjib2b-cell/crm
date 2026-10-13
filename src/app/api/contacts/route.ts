import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { isContactStatus } from "@/types/contact";
import type { Prisma } from "@prisma/client";

// Glej komentar v src/app/api/overview/route.ts - enak razlog.
export const dynamic = "force-dynamic";

// Vsak agent ima svoj osebni seznam kontaktov za klicanje (polje
// `assignedAgentId`). Privzeto ta pot vrne SAMO kontakte, dodeljene
// prijavljenemu agentu. Admin lahko z `?all=1` pogleda čisto vse
// (uporabljeno v Admin → Baza kontaktov), sicer tudi admin vidi samo
// svoj osebni seznam, enako kot vsak drug agent.
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Potrebna je prijava." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";
  const all = searchParams.get("all") === "1";

  const where: Prisma.ContactWhereInput = {};

  if (!(all && session.isAdmin)) {
    where.assignedAgentId = session.agentId;
  }

  if (status && isContactStatus(status)) {
    where.status = status;
  }

  if (q) {
    where.OR = [
      { firstName: { contains: q } },
      { lastName: { contains: q } },
      { company: { contains: q } },
      { phone: { contains: q } },
      { email: { contains: q } },
    ];
  }

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    include: {
      assignedAgent: true,
      callLogs: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { agent: true },
      },
    },
  });

  return NextResponse.json({
    contacts: contacts.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      company: c.company,
      phone: c.phone,
      email: c.email,
      notes: c.notes,
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      assignedAgentId: c.assignedAgentId,
      assignedAgentName: c.assignedAgent
        ? `${c.assignedAgent.firstName} ${c.assignedAgent.lastName}`.trim()
        : null,
      lastCall: c.callLogs[0]
        ? {
            agentName: `${c.callLogs[0].agent.firstName} ${c.callLogs[0].agent.lastName}`.trim(),
            status: c.callLogs[0].status,
            createdAt: c.callLogs[0].createdAt,
          }
        : null,
    })),
  });
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Potrebna je prijava." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const firstName = (body?.firstName ?? "").toString().trim();
  const lastName = (body?.lastName ?? "").toString().trim();

  if (!firstName && !lastName) {
    return NextResponse.json(
      { error: "Vnesite vsaj ime ali priimek." },
      { status: 400 }
    );
  }

  const contact = await prisma.contact.create({
    data: {
      firstName,
      lastName,
      // Ročno dodan kontakt se avtomatsko doda v OSEBNI seznam agenta, ki
      // ga je dodal - tako kot pri uvozu, le da je tu agent znan iz seje.
      assignedAgentId: session.agentId,
      company: body?.company?.toString().trim() || null,
      phone: body?.phone?.toString().trim() || null,
      email: body?.email?.toString().trim() || null,
      notes: body?.notes?.toString().trim() || null,
      status: "NEW",
    },
  });

  return NextResponse.json({ contact }, { status: 201 });
}
