"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { fetchCurrentAgent, type SessionAgent } from "@/lib/session-client";
import type { MeetingDTO } from "@/types/contact";

export default function KoledarPage() {
  const router = useRouter();
  const [agent, setAgent] = useState<SessionAgent | null>(null);
  const [meetings, setMeetings] = useState<MeetingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewAll, setViewAll] = useState(false);

  useEffect(() => {
    fetchCurrentAgent().then((a) => {
      if (!a) {
        router.replace("/");
        return;
      }
      setAgent(a);
    });
  }, [router]);

  useEffect(() => {
    if (!agent) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agent, viewAll]);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (agent?.isAdmin && viewAll) params.set("all", "1");
      const res = await fetch(`/api/meetings?${params.toString()}`);
      const data = await res.json();
      setMeetings(data.meetings ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function removeMeeting(id: string) {
    if (!confirm("Izbrisati sestanek?")) return;
    await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  }

  if (!agent) return null;

  const groups = new Map<string, MeetingDTO[]>();
  for (const m of [...meetings].sort((a, b) => a.startAt.localeCompare(b.startAt))) {
    const key = m.startAt.slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(m);
  }

  return (
    <div className="min-h-screen bg-[#f4f5f0]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-ink">📅 Koledar sestankov</h1>
          {agent.isAdmin && (
            <button
              onClick={() => setViewAll((v) => !v)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                viewAll
                  ? "border-ink bg-ink text-white"
                  : "border-[#d9dbd2] text-gray-600 hover:bg-[#f4f5f0]"
              }`}
            >
              {viewAll ? "Prikazujem: vsi agenti" : "Prikazujem: samo moji"}
            </button>
          )}
        </div>

        {loading && (
          <p className="rounded-2xl border border-[#d9dbd2] bg-white p-6 text-center text-sm text-gray-400 shadow-sm">
            Nalaganje …
          </p>
        )}

        {!loading && groups.size === 0 && (
          <p className="rounded-2xl border border-[#d9dbd2] bg-white p-6 text-center text-sm text-gray-400 shadow-sm">
            Ni vpisanih sestankov.
          </p>
        )}

        <div className="space-y-4">
          {[...groups.entries()].map(([date, items]) => (
            <div
              key={date}
              className="rounded-2xl border border-[#d9dbd2] bg-white p-4 shadow-sm"
            >
              <p className="mb-2 text-sm font-semibold text-ink">
                {new Date(`${date}T00:00:00`).toLocaleDateString("sl-SI", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <ul className="divide-y divide-[#eceee6]">
                {items.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <Link
                        href={`/klici?contactId=${m.contact.id}`}
                        className="font-medium text-ink underline decoration-accent decoration-2 underline-offset-2"
                      >
                        {new Date(m.startAt).toLocaleTimeString("sl-SI", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        · {m.contact.firstName} {m.contact.lastName}
                      </Link>
                      {m.contact.company && (
                        <p className="text-xs text-gray-500">{m.contact.company}</p>
                      )}
                      {viewAll && (
                        <p className="text-xs text-gray-400">
                          Agent: {m.agent.firstName} {m.agent.lastName}
                        </p>
                      )}
                      {m.note && <p className="mt-0.5 text-xs text-gray-500">{m.note}</p>}
                    </div>
                    <button
                      onClick={() => removeMeeting(m.id)}
                      className="shrink-0 rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      Izbriši
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
