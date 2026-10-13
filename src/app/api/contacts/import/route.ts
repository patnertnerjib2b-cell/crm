import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

interface ImportRow {
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

// Uvoz kontaktov - pričakuje JSON, ki ga je datoteka (Excel/CSV) predhodno
// pretvorila že na strani odjemalca (glej ImportDropzone.tsx), tako da
// strežnik ne potrebuje dodatnih knjižnic za branje binarnih Excel datotek.
//
// Neobvezen `assignedAgentId` v telesu zahteve doda VSE vrstice tega
// uvoza v osebni seznam enega agenta (npr. uvoz 50 novih leadov za
// enega agenta naenkrat). Admin-only, da si agent ne more sam dodeliti
// kontaktov drugega agenta.
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Potrebna je prijava." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const rows = body?.rows as ImportRow[] | undefined;
  const assignedAgentId = body?.assignedAgentId
    ? body.assignedAgentId.toString().trim()
    : null;

  if (assignedAgentId && !session.isAdmin) {
    return NextResponse.json({ error: "Dostop zavrnjen." }, { status: 403 });
  }

  if (assignedAgentId) {
    const targetAgent = await prisma.agent.findUnique({ where: { id: assignedAgentId } });
    if (!targetAgent) {
      return NextResponse.json({ error: "Agent ne obstaja." }, { status: 400 });
    }
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json(
      { error: "Datoteka ne vsebuje uporabnih vrstic." },
      { status: 400 }
    );
  }

  const cleaned = rows
    .map((r) => ({
      firstName: (r.firstName ?? "").toString().trim(),
      lastName: (r.lastName ?? "").toString().trim(),
      company: (r.company ?? "").toString().trim() || null,
      phone: (r.phone ?? "").toString().trim() || null,
      email: (r.email ?? "").toString().trim() || null,
      notes: (r.notes ?? "").toString().trim() || null,
      assignedAgentId,
      status: "NEW",
    }))
    .filter((r) => r.firstName || r.lastName || r.phone || r.company);

  const skipped = rows.length - cleaned.length;

  if (cleaned.length === 0) {
    return NextResponse.json(
      { error: "Nobena vrstica ni vsebovala uporabnih podatkov (ime/priimek/telefon/podjetje)." },
      { status: 400 }
    );
  }

  const result = await prisma.contact.createMany({ data: cleaned });

  return NextResponse.json({
    imported: result.count,
    skipped,
    totalRows: rows.length,
  });
}
