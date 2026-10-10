"use client";

import { useEffect, useState } from "react";
import { STATUS_CONFIG, type ContactStatus } from "@/types/contact";

interface Overview {
  totalContacts: number;
  statusCounts: { status: ContactStatus; count: number }[];
  totalAgents: number;
  activeAgents: number;
  weekTotalCalls: number;
  weekSuccessfulCalls: number;
}

export default function OverviewStats({ refreshKey }: { refreshKey?: number }) {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/overview")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading || !data) {
    return (
      <div className="rounded-2xl border border-[#d9dbd2] bg-white p-5 text-sm text-gray-400 shadow-sm">
        Nalaganje statistike …
      </div>
    );
  }

  const cards = [
    { label: "Kontaktov v bazi", value: data.totalContacts },
    { label: "Agentov (aktivnih)", value: `${data.activeAgents} / ${data.totalAgents}` },
    { label: "Klicev ta teden", value: data.weekTotalCalls },
    { label: "Uspešnih ta teden", value: data.weekSuccessfulCalls },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-[#d9dbd2] bg-white p-4 text-center shadow-sm"
          >
            <p className="text-2xl font-bold text-ink">{c.value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-[#d9dbd2] bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-ink">Kontakti po statusu</h3>
        <div className="mt-3 space-y-2">
          {data.statusCounts.map(({ status, count }) => {
            const cfg = STATUS_CONFIG[status];
            const pct = data.totalContacts > 0 ? (count / data.totalContacts) * 100 : 0;
            return (
              <div key={status} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-xs text-gray-600">
                  {cfg.icon} {cfg.label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#eceee6]">
                  <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 shrink-0 text-right text-xs font-semibold text-ink">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
