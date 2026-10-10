import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { isContactStatus } from "@/types/contact";
import { wouldCountTowardStats } from "@/lib/call-stats";

// PATCH - posodobi kontakt. Če je podan `status`, se to šteje kot
// "opravljen klic": status kontakta se posodobi IN ustvari se zapis v
// CallLog, kar se avtomatsko prišteje agentovemu tedenskemu rezultatu na
// leaderboardu. Če je podan samo `note` (brez statusa), gre zgolj za
// shranjevanje opombe in se klic NE šteje.
//
// Agent, ki se mu klic prišteje, se vedno izpelje iz prijavljene seje
// (piškotek), NE iz telesa zahteve - tako ni mogoče s poseganjem v klic
// (npr. prek orodij razvijalca) klic prištet drugemu agentu.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Potrebna je prijava." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Neveljavno telo zahteve." }, { status: 400 });
  }

  const { status, note } = body as {
    status?: string;
    note?: string;
  };

  const contact = await prisma.contact.findUnique({ where: { id: params.id } });
  if (!contact) {
    return NextResponse.json({ error: "Kontakt ne obstaja." }, { status: 404 });
  }

  // Samo posodobitev opombe, brez beleženja klica.
  if (status === undefined) {
    if (typeof note !== "string") {
      return NextResponse.json({ error: "Ni podatkov za posodobitev." }, { status: 400 });
    }
    const updated = await prisma.contact.update({
      where: { id: params.id },
      data: { notes: note },
    });
    return NextResponse.json({ contact: updated, loggedCall: false });
  }

  // Sprememba statusa = opravljen klic -> potrebujemo agenta iz seje.
  if (!isContactStatus(status)) {
    return NextResponse.json({ error: "Neveljaven status." }, { status: 400 });
  }

  const agent = await prisma.agent.findUnique({ where: { id: session.agentId } });
  if (!agent) {
    return NextResponse.json({ error: "Prijavljeni agent ne obstaja." }, { status: 404 });
  }

  // Glej lib/call-stats.ts: na lestvici/pregledu šteje samo prvi CallLog za
  // ta kontakt v celotni zgodovini. To moramo preveriti PRED ustvarjanjem
  // novega CallLog zapisa spodaj (sicer bi ta novi zapis že bil "prvi").
  // Sam CallLog zapis se VEDNO ustvari (zgodovina/"zadnji klic" ostaneta
  // točna) - `countsTowardStats` samo pove odzivu, ali ta sprememba dodaja
  // novo točko na lestvici ali gre le za popravek/napredovanje kontakta,
  // ki je bil že enkrat klican.
  const countsTowardStats = await wouldCountTowardStats(params.id);

  const [updatedContact] = await prisma.$transaction([
    prisma.contact.update({
      where: { id: params.id },
      data: {
        status,
        ...(typeof note === "string" ? { notes: note } : {}),
      },
    }),
    prisma.callLog.create({
      data: {
        contactId: params.id,
        agentId: agent.id,
        status,
        note: typeof note === "string" ? note : null,
      },
    }),
  ]);

  return NextResponse.json({
    contact: updatedContact,
    loggedCall: true,
    countsTowardStats,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.contact.delete({ where: { id: params.id } });
  } catch {
    return NextResponse.json({ error: "Kontakt ne obstaja." }, { status: 404 });
  }
  return NextResponse.json({ deleted: true });
}
