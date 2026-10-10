import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isContactStatus } from "@/types/contact";
import type { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const status = searchParams.get("status")?.trim() ?? "";

  const where: Prisma.ContactWhereInput = {};

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
      company: body?.company?.toString().trim() || null,
      phone: body?.phone?.toString().trim() || null,
      email: body?.email?.toString().trim() || null,
      notes: body?.notes?.toString().trim() || null,
      status: "NEW",
    },
  });

  return NextResponse.json({ contact }, { status: 201 });
}
