// Pomočnik za odjemalske (client) komponente: ker je sejni piškotek
// httpOnly (JS ga ne more prebrati), identiteto prijavljenega agenta
// pridobimo prek API klica na /api/auth/me.

export interface SessionAgent {
  id: string;
  firstName: string;
  lastName: string;
  isAdmin: boolean;
}

export async function fetchCurrentAgent(): Promise<SessionAgent | null> {
  try {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    return data.agent ?? null;
  } catch {
    return null;
  }
}

export async function logoutCurrentAgent(): Promise<void> {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignoriramo - uporabnika vseeno preusmerimo na prijavo
  }
}
