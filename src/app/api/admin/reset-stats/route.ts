import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

// Glej komentar v src/app/api/overview/route.ts - enak razlog.
export const dynamic = "force-dynamic";

// Admin akcija: pobriše VSE zapise CallLog (zgodovino klicev), s čimer se
// lestvica in tedenski pregled ponastavita na 0. Statusi in opombe
// kontaktov ostanejo nespremenjeni - briše se samo zgodovina klicev, na
// kateri temelji štetje. Po tem se šteje znova po pravilu "samo prva
// sprememba statusa na kontakt" (glej src/lib/call-stats.ts), zato prva
// naslednja sprememba statusa na vsakem kontaktu spet šteje kot nov klic.
export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req);
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Dostop zavrnjen." }, { status: 403 });
  }

  const { count } = await prisma.callLog.deleteMany({});

  return NextResponse.json({ deletedCallLogs: count });
}
