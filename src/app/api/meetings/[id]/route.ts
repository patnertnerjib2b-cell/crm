import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Potrebna je prijava." }, { status: 401 });
  }

  const meeting = await prisma.meeting.findUnique({ where: { id: params.id } });
  if (!meeting) {
    return NextResponse.json({ error: "Sestanek ne obstaja." }, { status: 404 });
  }

  if (meeting.agentId !== session.agentId && !session.isAdmin) {
    return NextResponse.json(
      { error: "Nimate dovoljenja za brisanje tega sestanka." },
      { status: 403 }
    );
  }

  await prisma.meeting.delete({ where: { id: params.id } });
  return NextResponse.json({ deleted: true });
}
