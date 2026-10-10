import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  verifyPassword,
} from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const username = (body?.username ?? "").toString().trim().toLowerCase();
  const password = (body?.password ?? "").toString();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Vnesite uporabniško ime in geslo." },
      { status: 400 }
    );
  }

  const agent = await prisma.agent.findUnique({ where: { username } });
  if (!agent || !agent.active || !agent.passwordHash) {
    return NextResponse.json(
      { error: "Napačno uporabniško ime ali geslo." },
      { status: 401 }
    );
  }

  const ok = await verifyPassword(password, agent.passwordHash);
  if (!ok) {
    return NextResponse.json(
      { error: "Napačno uporabniško ime ali geslo." },
      { status: 401 }
    );
  }

  const token = createSessionToken({ agentId: agent.id, isAdmin: agent.isAdmin });

  const res = NextResponse.json({
    agent: {
      id: agent.id,
      firstName: agent.firstName,
      lastName: agent.lastName,
      isAdmin: agent.isAdmin,
    },
  });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
