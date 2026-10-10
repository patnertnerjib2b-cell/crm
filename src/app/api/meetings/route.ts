import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MEETING_INCLUDE = {
  contact: {
    select: { id: true, firstName: true, lastName: true, company: true, phone: true },
  },
  agent: {
    select: { id: true, firstName: true, lastName: true },
  },
} as const;

// GET - seznam sestankov. Navaden agent vidi samo svoje; admin lahko z
// ?all=1 pridobi sestanke vseh agentov (uporabljeno na /koledar).
// ?contactId=... omeji na sestanke posameznega kontakta.
export async function GET(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Potrebna je prijava." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contactId");
  const wantsAll = searchParams.get("all") === "1";

  const where: Record<string, unknown> = {};
  if (contactId) where.contactId = contactId;
  if (!(session.isAdmin && wantsAll)) {
    where.agentId = session.agentId;
  }

  const meetings = await prisma.meeting.findMany({
    where,
    orderBy: { startAt: "asc" },
    include: MEETING_INCLUDE,
  });

  return NextResponse.json({ meetings });
}

// POST - vpiši nov sestanek. Agent je vedno trenutno prijavljen agent
// (izpeljan iz seje, ne iz telesa zahteve), kontakt pa mora obstajati -
// nepovezanih/prostih sestankov ni mogoče ustvariti.
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Potrebna je prijava." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const contactId = (body?.contactId ?? "").toString();
  const startAtRaw = (body?.startAt ?? "").toString();
  const note = typeof body?.note === "string" ? body.note.trim() : "";

  if (!contactId || !startAtRaw) {
    return NextResponse.json(
      { error: "Kontakt in datum/čas sestanka sta obvezna." },
      { status: 400 }
    );
  }

  const startAt = new Date(startAtRaw);
  if (Number.isNaN(startAt.getTime())) {
    return NextResponse.json({ error: "Neveljaven datum/čas." }, { status: 400 });
  }

  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) {
    return NextResponse.json({ error: "Kontakt ne obstaja." }, { status: 404 });
  }

  const meeting = await prisma.meeting.create({
    data: {
      contactId,
      agentId: session.agentId,
      startAt,
      note: note || null,
    },
    include: MEETING_INCLUDE,
  });

  return NextResponse.json({ meeting }, { status: 201 });
}
