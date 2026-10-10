import { prisma } from "@/lib/db";

export interface CountingCallLog {
  id: string;
  contactId: string;
  agentId: string;
  status: string;
  createdAt: Date;
}

// Vrne CallLog zapise, ki se dejansko štejejo kot "klic" na lestvici in v
// pregledu. Za vsak kontakt šteje samo NAJZGODNEJŠI zapis v celotni
// zgodovini (ne glede na teden ali koliko kasnejših sprememb statusa je
// bilo) - tako popravki in napredovanje istega kontakta skozi lijak
// (Nov → Zainteresiran → Poslana ponudba ...) ne napihujejo števca klicev.
// Vsaka sprememba statusa SE ŠE VEDNO zabeleži v CallLog (zgodovina in
// "zadnji klic" na kartici kontakta ostajata točna), le pri štetju na
// lestvici/pregledu se upošteva samo prva.
export async function getCountingCallLogs(): Promise<CountingCallLog[]> {
  const allLogs = await prisma.callLog.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, contactId: true, agentId: true, status: true, createdAt: true },
  });

  const seen = new Set<string>();
  const counting: CountingCallLog[] = [];
  for (const log of allLogs) {
    if (seen.has(log.contactId)) continue;
    seen.add(log.contactId);
    counting.push(log);
  }
  return counting;
}

// Ali bi naslednji CallLog za ta kontakt štel na lestvici (true, če ta
// kontakt še nima nobenega prejšnjega CallLog zapisa).
export async function wouldCountTowardStats(contactId: string): Promise<boolean> {
  const priorCall = await prisma.callLog.findFirst({ where: { contactId } });
  return !priorCall;
}
