"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setAgentCookie, getAgentFromCookie } from "@/lib/agent-cookie";
import type { AgentDTO } from "@/types/contact";

export default function AgentSelectPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);

  useEffect(() => {
    // Če je agent že izbran (piškotek), to samo označimo na seznamu -
    // vseeno pustimo na tej strani možnost zamenjave.
    setCurrentAgentId(getAgentFromCookie()?.id ?? null);
    fetchAgents();
  }, []);

  async function fetchAgents() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents((data.agents ?? []).filter((a: AgentDTO) => a.active));
    } catch {
      setError("Napaka pri nalaganju seznama agentov.");
    } finally {
      setLoading(false);
    }
  }

  function selectAgent(agent: AgentDTO) {
    setAgentCookie(agent.id, `${agent.firstName} ${agent.lastName}`.trim());
    router.push("/klici");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f4f5f0] px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-xl font-bold text-accent">
            O
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">ONYX CRM</h1>
          <p className="mt-1 text-sm text-gray-500">
            Izberite svoje ime, da začnete s klicanjem.
          </p>
        </div>

        <div className="rounded-2xl border border-[#d9dbd2] bg-white p-5 shadow-sm">
          {loading && (
            <p className="py-6 text-center text-sm text-gray-400">Nalaganje agentov …</p>
          )}

          {error && (
            <p className="py-4 text-center text-sm text-red-600">{error}</p>
          )}

          {!loading && !error && agents.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-500">
              <p>Še ni dodanih agentov.</p>
              <Link
                href="/admin"
                className="mt-3 inline-block rounded-full bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-black"
              >
                Dodaj agenta v Admin
              </Link>
            </div>
          )}

          {!loading && agents.length > 0 && (
            <ul className="divide-y divide-[#eceee6]">
              {agents.map((agent) => (
                <li key={agent.id}>
                  <button
                    onClick={() => selectAgent(agent)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition-colors hover:bg-[#f4f5f0]"
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef7de] text-sm font-semibold text-ink">
                        {agent.firstName.charAt(0)}
                        {agent.lastName.charAt(0)}
                      </span>
                      <span className="font-medium text-ink">
                        {agent.firstName} {agent.lastName}
                      </span>
                    </span>
                    {currentAgentId === agent.id && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-ink">
                        trenutni
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-4 text-xs text-gray-400">
          <Link href="/lestvica" className="hover:text-gray-600">
            Lestvica →
          </Link>
          <Link href="/admin" className="hover:text-gray-600">
            Admin →
          </Link>
        </div>
      </div>
    </main>
  );
}
