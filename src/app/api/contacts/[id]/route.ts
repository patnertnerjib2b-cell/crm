import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isContactStatus } from "@/types/contact";

// PATCH - posodobi kontakt. Če je podan `status`, se to šteje kot
// "opravljen klic": status kontakta se posodobi IN ustvari se zapis v
// CallLog, kar se avtomatsko prišteje agentovemu tedenskemu rezultatu na
// leaderboardu. Če je podan samo `note` (brez statusa), gre zgolj za
// shranjevanje opombe in se klic NE šteje.
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Neveljavno telo zahteve." }, { status: 400 });
  }

  const { status, note, agentId } = body as {
    status?: string;
    note?: string;
    agentId?: string;
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

  // Sprememba statusa = opravljen klic -> potrebujemo agenta.
  if (!isContactStatus(status)) {
    return NextResponse.json({ error: "Neveljaven status." }, { status: 400 });
  }
  if (!agentId) {
    return NextResponse.json(
      { error: "Za beleženje klica je potreben izbran agent." },
      { status: 400 }
    );
  }

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) {
    return NextResponse.json({ error: "Izbrani agent ne obstaja." }, { status: 404 });
  }

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
        agentId,
        status,
        note: typeof note === "string" ? note : null,
      },
    }),
  ]);

  return NextResponse.json({ contact: updatedContact, loggedCall: true });
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
