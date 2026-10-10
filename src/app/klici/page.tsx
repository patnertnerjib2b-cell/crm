"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import StatusBadge from "@/components/StatusBadge";
import { fetchCurrentAgent, type SessionAgent } from "@/lib/session-client";
import {
  CONTACT_STATUSES,
  STATUS_CONFIG,
  type ContactDTO,
  type ContactStatus,
  type MeetingDTO,
} from "@/types/contact";

type StatusFilter = "ALL" | ContactStatus;

export default function KliciPage() {
  return (
    <Suspense fallback={null}>
      <KliciPageInner />
    </Suspense>
  );
}

function KliciPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialContactId = searchParams.get("contactId");

  const [agent, setAgent] = useState<SessionAgent | null>(null);
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(initialContactId);
  const [noteDraft, setNoteDraft] = useState("");
  const [saving, setSaving] = useState<ContactStatus | "note" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Sestanki za izbrani kontakt
  const [meetings, setMeetings] = useState<MeetingDTO[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingNote, setMeetingNote] = useState("");
  const [savingMeeting, setSavingMeeting] = useState(false);
  const [meetingError, setMeetingError] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentAgent().then((a) => {
      if (!a) {
        router.replace("/");
        return;
      }
      setAgent(a);
    });
  }, [router]);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("q", search.trim());
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      const res = await fetch(`/api/contacts?${params.toString()}`);
      const data = await res.json();
      setContacts(data.contacts ?? []);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    if (!agent) return;
    loadContacts();
  }, [agent, loadContacts]);

  // Debounce iskanja
  useEffect(() => {
    if (!agent) return;
    const t = setTimeout(() => loadContacts(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const selected = useMemo(
    () => contacts.find((c) => c.id === selectedId) ?? null,
    [contacts, selectedId]
  );

  useEffect(() => {
    setNoteDraft(selected?.notes ?? "");
  }, [selected?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMeetings = useCallback(async (contactId: string) => {
    setMeetingsLoading(true);
    try {
      const res = await fetch(`/api/meetings?contactId=${contactId}`);
      const data = await res.json();
      setMeetings(data.meetings ?? []);
    } finally {
      setMeetingsLoading(false);
    }
  }, []);

  useEffect(() => {
    setMeetingError(null);
    setMeetingDate("");
    setMeetingNote("");
    if (selected) {
      loadMeetings(selected.id);
    } else {
      setMeetings([]);
    }
  }, [selected?.id, loadMeetings]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  async function setStatus(status: ContactStatus) {
    if (!selected || !agent) return;
    setSaving(status);
    try {
      const res = await fetch(`/api/contacts/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: noteDraft }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setContacts((prev) =>
        prev.map((c) =>
          c.id === selected.id
            ? {
                ...c,
                ...data.contact,
                lastCall: {
                  agentName: `${agent.firstName} ${agent.lastName}`.trim(),
                  status,
                  createdAt: new Date().toISOString(),
                },
              }
            : c
        )
      );
      setToast(`Klic zabeležen: ${STATUS_CONFIG[status].label} (+1 na lestvici)`);
    } catch {
      setToast("Napaka pri shranjevanju. Poskusite znova.");
    } finally {
      setSaving(null);
    }
  }

  async function saveNoteOnly() {
    if (!selected) return;
    setSaving("note");
    try {
      const res = await fetch(`/api/contacts/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteDraft }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setContacts((prev) =>
        prev.map((c) => (c.id === selected.id ? { ...c, ...data.contact } : c))
      );
      setToast("Opomba shranjena.");
    } catch {
      setToast("Napaka pri shranjevanju opombe.");
    } finally {
      setSaving(null);
    }
  }

  async function addMeeting(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (!meetingDate) {
      setMeetingError("Izberite datum in čas sestanka.");
      return;
    }
    setSavingMeeting(true);
    setMeetingError(null);
    try {
      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selected.id,
          startAt: new Date(meetingDate).toISOString(),
          note: meetingNote,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Napaka pri shranjevanju.");
      setMeetings((prev) =>
        [...prev, data.meeting].sort((a, b) => a.startAt.localeCompare(b.startAt))
      );
      setMeetingDate("");
      setMeetingNote("");
      setToast("Sestanek dodan v koledar.");
    } catch (err) {
      setMeetingError(err instanceof Error ? err.message : "Napaka pri shranjevanju.");
    } finally {
      setSavingMeeting(false);
    }
  }

  async function removeMeeting(id: string) {
    if (!confirm("Izbrisati sestanek?")) return;
    await fetch(`/api/meetings/${id}`, { method: "DELETE" });
    setMeetings((prev) => prev.filter((m) => m.id !== id));
  }

  if (!agent) return null;

  return (
    <div className="min-h-screen bg-[#f4f5f0]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-bold text-ink">Klicanje</h1>
          <span className="text-sm text-gray-500">
            {contacts.length} {contacts.length === 1 ? "kontakt" : "kontaktov"}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[360px_1fr]">
          {/* Seznam kontaktov */}
          <div className="rounded-2xl border border-[#d9dbd2] bg-white shadow-sm">
            <div className="space-y-2 border-b border-[#eceee6] p-3">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Išči po imenu, podjetju, telefonu …"
                className="w-full rounded-lg border border-[#d9dbd2] px-3 py-2 text-sm outline-none focus:border-ink"
              />
              <div className="flex flex-wrap gap-1.5">
                <FilterChip
                  active={statusFilter === "ALL"}
                  onClick={() => setStatusFilter("ALL")}
                  label="Vsi"
                />
                {CONTACT_STATUSES.map((s) => (
                  <FilterChip
                    key={s}
                    active={statusFilter === s}
                    onClick={() => setStatusFilter(s)}
                    label={`${STATUS_CONFIG[s].icon} ${STATUS_CONFIG[s].shortLabel}`}
                  />
                ))}
              </div>
            </div>

            <div className="thin-scroll max-h-[65vh] overflow-y-auto">
              {loading && (
                <p className="p-4 text-center text-sm text-gray-400">Nalaganje …</p>
              )}
              {!loading && contacts.length === 0 && (
                <p className="p-4 text-center text-sm text-gray-400">
                  Ni najdenih kontaktov.
                </p>
              )}
              <ul className="divide-y divide-[#eceee6]">
                {contacts.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className={`flex w-full flex-col gap-1 px-4 py-3 text-left transition-colors ${
                        selectedId === c.id ? "bg-[#eef7de]" : "hover:bg-[#f4f5f0]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-ink">
                          {c.firstName} {c.lastName}
                        </span>
                        <StatusBadge status={c.status} />
                      </div>
                      <span className="truncate text-xs text-gray-500">
                        {c.company || "—"} {c.phone ? `· ${c.phone}` : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Podrobnosti / klicanje */}
          <div className="rounded-2xl border border-[#d9dbd2] bg-white p-5 shadow-sm">
            {!selected && (
              <div className="flex h-full min-h-[300px] items-center justify-center text-sm text-gray-400">
                Izberite kontakt s seznama na levi.
              </div>
            )}

            {selected && (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-ink">
                      {selected.firstName} {selected.lastName}
                    </h2>
                    <p className="text-sm text-gray-500">{selected.company || "Brez podjetja"}</p>
                  </div>
                  <StatusBadge status={selected.status} />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#eceee6] bg-[#f9faf6] p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400">Telefon</p>
                    {selected.phone ? (
                      <a
                        href={`tel:${selected.phone.replace(/\s+/g, "")}`}
                        className="mt-0.5 block text-base font-semibold text-ink underline decoration-accent decoration-2 underline-offset-2"
                      >
                        📞 {selected.phone}
                      </a>
                    ) : (
                      <p className="mt-0.5 text-sm text-gray-400">Ni vnesen</p>
                    )}
                  </div>
                  <div className="rounded-xl border border-[#eceee6] bg-[#f9faf6] p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-400">E-pošta</p>
                    <p className="mt-0.5 text-sm text-ink">{selected.email || "—"}</p>
                  </div>
                </div>

                {selected.lastCall && (
                  <p className="mt-3 text-xs text-gray-400">
                    Zadnji klic: {STATUS_CONFIG[selected.lastCall.status].label} ·{" "}
                    {selected.lastCall.agentName} ·{" "}
                    {new Date(selected.lastCall.createdAt).toLocaleString("sl-SI")}
                  </p>
                )}

                <div className="mt-5">
                  <p className="mb-2 text-sm font-semibold text-ink">
                    Status klica (samodejno se prišteje na lestvico)
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {CONTACT_STATUSES.map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        disabled={saving !== null}
                        className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-sm font-medium transition-colors disabled:opacity-50 ${STATUS_CONFIG[s].buttonClass}`}
                      >
                        <span className="text-lg">{STATUS_CONFIG[s].icon}</span>
                        <span className="text-center leading-tight">
                          {STATUS_CONFIG[s].label}
                        </span>
                        {saving === s && <span className="text-[10px]">shranjujem …</span>}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5">
                  <label className="mb-1 block text-sm font-semibold text-ink">
                    Hitra opomba
                  </label>
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={3}
                    placeholder="Npr. pokliče nazaj jutri popoldne …"
                    className="w-full rounded-lg border border-[#d9dbd2] px-3 py-2 text-sm outline-none focus:border-ink"
                  />
                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={saveNoteOnly}
                      disabled={saving !== null}
                      className="rounded-full border border-[#d9dbd2] px-4 py-1.5 text-xs font-medium text-ink hover:bg-[#f4f5f0] disabled:opacity-50"
                    >
                      {saving === "note" ? "Shranjujem …" : "Shrani opombo (brez klica)"}
                    </button>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#eceee6] pt-5">
                  <p className="mb-2 text-sm font-semibold text-ink">📅 Sestanki</p>

                  {meetingsLoading && (
                    <p className="text-sm text-gray-400">Nalaganje …</p>
                  )}
                  {!meetingsLoading && meetings.length === 0 && (
                    <p className="text-sm text-gray-400">
                      Za ta kontakt še ni vpisanih sestankov.
                    </p>
                  )}
                  {!meetingsLoading && meetings.length > 0 && (
                    <ul className="mb-3 divide-y divide-[#eceee6]">
                      {meetings.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center justify-between gap-2 py-2 text-sm"
                        >
                          <div>
                            <span className="font-medium text-ink">
                              {new Date(m.startAt).toLocaleString("sl-SI", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </span>
                            {m.note && (
                              <span className="ml-2 text-xs text-gray-500">{m.note}</span>
                            )}
                          </div>
                          <button
                            onClick={() => removeMeeting(m.id)}
                            className="rounded-full border border-red-200 px-2.5 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            Izbriši
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form
                    onSubmit={addMeeting}
                    className="flex flex-wrap items-end gap-2 rounded-xl border border-[#eceee6] bg-[#f9faf6] p-3"
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-500">
                        Datum in čas
                      </label>
                      <input
                        type="datetime-local"
                        value={meetingDate}
                        onChange={(e) => setMeetingDate(e.target.value)}
                        className="mt-1 rounded-lg border border-[#d9dbd2] px-3 py-1.5 text-sm outline-none focus:border-ink"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500">
                        Opomba (neobvezno)
                      </label>
                      <input
                        value={meetingNote}
                        onChange={(e) => setMeetingNote(e.target.value)}
                        placeholder="Npr. sestanek na sedežu podjetja"
                        className="mt-1 w-full rounded-lg border border-[#d9dbd2] px-3 py-1.5 text-sm outline-none focus:border-ink"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={savingMeeting}
                      className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
                    >
                      {savingMeeting ? "Dodajam …" : "+ Dodaj sestanek"}
                    </button>
                  </form>
                  {meetingError && (
                    <p className="mt-2 text-sm text-red-600">{meetingError}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-ink bg-ink text-white"
          : "border-[#d9dbd2] text-gray-600 hover:bg-[#f4f5f0]"
      }`}
    >
      {label}
    </button>
  );
}
