// Prava prijava agentov: uporabniško ime + geslo (hash z bcrypt), seja pa
// je podpisan httpOnly piškotek (HMAC-SHA256, Node-ov vgrajeni `crypto`,
// brez dodatnih odvisnosti). V nasprotju s staro `agent-cookie.ts` rešitvijo
// piškotka JS na strani odjemalca ne more prebrati - zato komponente
// identiteto agenta pridobijo prek `/api/auth/me` (glej lib/session-client.ts).
//
// SESSION_SECRET: v Vercelu ga lahko po želji dodate kot okoljsko
// spremenljivko za dodatno varnost. Če ni nastavljena, se za podpisovanje
// uporabi DATABASE_URL (ki ga Vercel Prisma Postgres integracija že nastavi
// in je prav tako skrivnost), kot varen privzeti nadomestek.
import { createHmac, timingSafeEqual } from "crypto";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

export const SESSION_COOKIE_NAME = "onyx_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dni

const BCRYPT_ROUNDS = 10;

function getSigningSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    process.env.DATABASE_URL ||
    "onyx-crm-insecure-fallback-secret-change-me"
  );
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

export interface SessionPayload {
  agentId: string;
  isAdmin: boolean;
  exp: number; // unix čas (sekunde), ko seja poteče
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64urlDecode(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(padded, "base64");
}

function sign(data: string): string {
  const hmac = createHmac("sha256", getSigningSecret());
  hmac.update(data);
  return base64url(hmac.digest());
}

export function createSessionToken(payload: {
  agentId: string;
  isAdmin: boolean;
}): string {
  const full: SessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };
  const body = base64url(JSON.stringify(full));
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;

  const expectedSignature = sign(body);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (
    sigBuf.length !== expectedBuf.length ||
    !timingSafeEqual(sigBuf, expectedBuf)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(base64urlDecode(body).toString("utf8")) as SessionPayload;
    if (
      typeof payload.agentId !== "string" ||
      typeof payload.isAdmin !== "boolean" ||
      typeof payload.exp !== "number"
    ) {
      return null;
    }
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // seja je potekla
    }
    return payload;
  } catch {
    return null;
  }
}

// Pridobi in preveri sejo iz zahteve (za uporabo v Route Handlerjih).
export function getSessionFromRequest(req: NextRequest): SessionPayload | null {
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}
