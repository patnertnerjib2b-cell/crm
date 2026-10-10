// Enostavna "prijava" - ni gesel, agent le izbere svoje ime s seznama.
// Izbira se shrani v navaden (ne-httpOnly) piškotek, da jo lahko bere
// tako odjemalec (client components) kot strežnik (API route lahko po
// želji prebere `agentId` iz telesa zahteve namesto piškotka).

export const AGENT_COOKIE_NAME = "onyx_agent_id";
export const AGENT_NAME_COOKIE = "onyx_agent_name";

export function setAgentCookie(agentId: string, agentName: string) {
  if (typeof document === "undefined") return;
  const maxAge = 60 * 60 * 24 * 30; // 30 dni
  document.cookie = `${AGENT_COOKIE_NAME}=${encodeURIComponent(
    agentId
  )}; path=/; max-age=${maxAge}; samesite=lax`;
  document.cookie = `${AGENT_NAME_COOKIE}=${encodeURIComponent(
    agentName
  )}; path=/; max-age=${maxAge}; samesite=lax`;
}

export function clearAgentCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${AGENT_COOKIE_NAME}=; path=/; max-age=0`;
  document.cookie = `${AGENT_NAME_COOKIE}=; path=/; max-age=0`;
}

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

export function getAgentFromCookie(): { id: string; name: string } | null {
  const id = readCookie(AGENT_COOKIE_NAME);
  const name = readCookie(AGENT_NAME_COOKIE);
  if (!id || !name) return null;
  return { id, name };
}
