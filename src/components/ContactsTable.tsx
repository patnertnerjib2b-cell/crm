"use client";

import { useEffect, useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import type { ContactDTO } from "@/types/contact";

export default function ContactsTable({ refreshKey }: { refreshKey?: number }) {
  const [contacts, setContacts] = useState<ContactDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/contacts?${params.toString()}`);
      const data = await res.json();
      setContacts(data.contacts ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function removeContact(id: string) {
    if (!confirm("Izbrisati ta kontakt?")) return;
    await fetch(`/api/contacts/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="rounded-2xl border border-[#d9dbd2] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-ink">Baza kontaktov</h2>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Išči …"
          className="rounded-lg border border-[#d9dbd2] px-3 py-1.5 text-sm outline-none focus:border-ink"
        />
      </div>

      <div className="thin-scroll mt-4 max-h-[60vh] overflow-auto rounded-lg border border-[#eceee6]">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="sticky top-0 bg-[#f4f5f0] text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-3 py-2">Ime in priimek</th>
              <th className="px-3 py-2">Podjetje</th>
              <th className="px-3 py-2">Telefon</th>
              <th className="px-3 py-2">E-pošta</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceee6]">
            {loading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
                  Nalaganje …
                </td>
              </tr>
            )}
            {!loading && contacts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-gray-400">
                  Ni kontaktov. Uvozite jih v zavihku &quot;Uvoz&quot;.
                </td>
              </tr>
            )}
            {contacts.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2 font-medium text-ink">
                  {c.firstName} {c.lastName}
                </td>
                <td className="px-3 py-2 text-gray-600">{c.company || "—"}</td>
                <td className="px-3 py-2 text-gray-600">{c.phone || "—"}</td>
                <td className="px-3 py-2 text-gray-600">{c.email || "—"}</td>
                <td className="px-3 py-2">
                  <StatusBadge status={c.status} />
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    onClick={() => removeContact(c.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Izbriši
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-400">Skupaj: {contacts.length} kontaktov</p>
    </div>
  );
}
