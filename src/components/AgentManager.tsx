"use client";

import { useEffect, useState } from "react";
import type { AgentDTO } from "@/types/contact";

export default function AgentManager() {
  const [agents, setAgents] = useState<AgentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Polje za "Novo geslo" se zdaj ureja znotraj strani (ne več prek
  // window.prompt) - na nekaterih brskalnikih (predvsem mobilni Safari /
  // vdelani brskalniki v aplikacijah) se native prompt() okno sploh ne
  // prikaže in gumb je zato videti, kot da "ne dela".
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [resetValue, setResetValue] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSaving, setResetSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/agents");
      const data = await res.json();
      setAgents(data.agents ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addAgent(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim()) {
      setError("Vnesite vsaj ime.");
      return;
    }
    if (!username.trim()) {
      setError("Vnesite uporabniško ime.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Geslo mora imeti vsaj 6 znakov.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, username, password, isAdmin }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Napaka");
      setFirstName("");
      setLastName("");
      setUsername("");
      setPassword("");
      setIsAdmin(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Napaka pri dodajanju agenta.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(agent: AgentDTO) {
    await fetch(`/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !agent.active }),
    });
    await load();
  }

  async function toggleAdmin(agent: AgentDTO) {
    await fetch(`/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !agent.isAdmin }),
    });
    await load();
  }

  function openResetPassword(agent: AgentDTO) {
    setResetTargetId(agent.id);
    setResetValue("");
    setResetError(null);
  }

  function cancelResetPassword() {
    setResetTargetId(null);
    setResetValue("");
    setResetError(null);
  }

  async function submitResetPassword(agent: AgentDTO) {
    if (resetValue.length < 6) {
      setResetError("Geslo mora imeti vsaj 6 znakov.");
      return;
    }
    setResetSaving(true);
    setResetError(null);
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetValue }),
      });
      if (!res.ok) {
        setResetError((await res.json()).error ?? "Napaka pri spremembi gesla.");
        return;
      }
      setResetTargetId(null);
      setResetValue("");
    } catch {
      setResetError("Napaka pri povezavi s strežnikom.");
    } finally {
      setResetSaving(false);
    }
  }

  async function removeAgent(agent: AgentDTO) {
    if (!confirm(`Odstraniti agenta ${agent.firstName} ${agent.lastName}?`)) return;
    await fetch(`/api/agents/${agent.id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="rounded-2xl border border-[#d9dbd2] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-ink">Agenti</h2>
      <p className="mt-1 text-sm text-gray-500">
        Uporabniški računi agentov. Vsak agent se prijavi s svojim uporabniškim
        imenom in geslom, ki ga dodelite tukaj.
      </p>

      <form onSubmit={addAgent} className="mt-4 flex flex-wrap items-end gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-500">Ime</label>
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="mt-1 rounded-lg border border-[#d9dbd2] px-3 py-1.5 text-sm outline-none focus:border-ink"
            placeholder="Luka"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Priimek</label>
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="mt-1 rounded-lg border border-[#d9dbd2] px-3 py-1.5 text-sm outline-none focus:border-ink"
            placeholder="Novak"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">
            Uporabniško ime
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 rounded-lg border border-[#d9dbd2] px-3 py-1.5 text-sm outline-none focus:border-ink"
            placeholder="luka.novak"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500">Geslo</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 rounded-lg border border-[#d9dbd2] px-3 py-1.5 text-sm outline-none focus:border-ink"
            placeholder="vsaj 6 znakov"
          />
        </div>
        <label className="flex items-center gap-1.5 pb-1.5 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            className="rounded border-[#d9dbd2]"
          />
          Admin
        </label>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
        >
          {saving ? "Dodajam …" : "+ Dodaj agenta"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-5 divide-y divide-[#eceee6]">
        {loading && <p className="py-4 text-sm text-gray-400">Nalaganje …</p>}
        {!loading && agents.length === 0 && (
          <p className="py-4 text-sm text-gray-400">Ni dodanih agentov.</p>
        )}
        {agents.map((agent) => (
          <li key={agent.id} className="py-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef7de] text-xs font-semibold text-ink">
                  {agent.firstName.charAt(0)}
                  {agent.lastName.charAt(0)}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${agent.active ? "text-ink" : "text-gray-400 line-through"}`}>
                      {agent.firstName} {agent.lastName}
                    </span>
                    {agent.isAdmin && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-ink">
                        admin
                      </span>
                    )}
                    {!agent.active && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                        neaktiven
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">
                    {agent.username ? `@${agent.username}` : "brez prijave – dodelite uporabniško ime"}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    resetTargetId === agent.id ? cancelResetPassword() : openResetPassword(agent)
                  }
                  className="rounded-full border border-[#d9dbd2] px-3 py-1 text-xs font-medium hover:bg-[#f4f5f0]"
                >
                  {resetTargetId === agent.id ? "Prekliči" : "Novo geslo"}
                </button>
                <button
                  onClick={() => toggleAdmin(agent)}
                  className="rounded-full border border-[#d9dbd2] px-3 py-1 text-xs font-medium hover:bg-[#f4f5f0]"
                >
                  {agent.isAdmin ? "Odvzemi admin" : "Naredi admin"}
                </button>
                <button
                  onClick={() => toggleActive(agent)}
                  className="rounded-full border border-[#d9dbd2] px-3 py-1 text-xs font-medium hover:bg-[#f4f5f0]"
                >
                  {agent.active ? "Deaktiviraj" : "Aktiviraj"}
                </button>
                <button
                  onClick={() => removeAgent(agent)}
                  className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  Izbriši
                </button>
              </div>
            </div>

            {resetTargetId === agent.id && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg bg-[#f4f5f0] p-3">
                <label className="text-xs font-medium text-gray-500">
                  Novo geslo za {agent.firstName} {agent.lastName}:
                </label>
                <input
                  type="text"
                  autoFocus
                  value={resetValue}
                  onChange={(e) => setResetValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") submitResetPassword(agent);
                    if (e.key === "Escape") cancelResetPassword();
                  }}
                  placeholder="vsaj 6 znakov"
                  className="rounded-lg border border-[#d9dbd2] px-3 py-1.5 text-sm outline-none focus:border-ink"
                />
                <button
                  type="button"
                  disabled={resetSaving}
                  onClick={() => submitResetPassword(agent)}
                  className="rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:opacity-50"
                >
                  {resetSaving ? "Shranjujem …" : "Shrani geslo"}
                </button>
                <button
                  type="button"
                  onClick={cancelResetPassword}
                  className="rounded-full border border-[#d9dbd2] px-3 py-1.5 text-xs font-medium hover:bg-white"
                >
                  Prekliči
                </button>
                {resetError && <p className="w-full text-xs text-red-600">{resetError}</p>}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
