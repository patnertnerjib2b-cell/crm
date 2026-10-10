"use client";

import { useCallback, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { getAgentFromCookie } from "@/lib/agent-cookie";
import type { LeaderboardRow } from "@/types/contact";

interface LeaderboardResponse {
  weekLabel: string;
  isCurrentWeek: boolean;
  rows: LeaderboardRow[];
  teamTotals: { totalCalls: number; successfulCalls: number };
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function LestvicaPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentAgentId, setCurrentAgentId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentAgentId(getAgentFromCookie()?.id ?? null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?weekOffset=${weekOffset}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    load();
  }, [load]);

  const maxCalls = data?.rows.length
    ? Math.max(...data.rows.map((r) => r.totalCalls), 1)
    : 1;

  return (
    <div className="min-h-screen bg-[#f4f5f0]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-ink">🏆 Tedenski leaderboard</h1>
            <p className="text-sm text-gray-500">
              Teden: <span className="font-medium text-ink">{data?.weekLabel ?? "…"}</span>
              {data?.isCurrentWeek && (
                <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-ink">
                  tekoči teden
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="rounded-full border border-[#d9dbd2] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#f4f5f0]"
            >
              ← Prejšnji teden
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
              className="rounded-full border border-[#d9dbd2] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#f4f5f0] disabled:opacity-40"
            >
              Ta teden
            </button>
            <button
              onClick={() => setWeekOffset((w) => Math.min(0, w + 1))}
              disabled={weekOffset === 0}
              className="rounded-full border border-[#d9dbd2] bg-white px-3 py-1.5 text-sm font-medium hover:bg-[#f4f5f0] disabled:opacity-40"
            >
              Naslednji teden →
            </button>
          </div>
        </div>

        {data && (
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#d9dbd2] bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-ink">{data.teamTotals.totalCalls}</p>
              <p className="text-xs text-gray-500">Skupno klicev ekipe</p>
            </div>
            <div className="rounded-2xl border border-[#d9dbd2] bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-bold text-ink">
                {data.teamTotals.successfulCalls}
              </p>
              <p className="text-xs text-gray-500">Uspešnih (zainteresiran/sestanek)</p>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-[#d9dbd2] bg-white shadow-sm">
          {loading && <p className="p-6 text-center text-sm text-gray-400">Nalaganje …</p>}

          {!loading && data && data.rows.length === 0 && (
            <p className="p-6 text-center text-sm text-gray-400">
              V tem tednu še ni zabeleženih klicev.
            </p>
          )}

          {!loading && data && data.rows.length > 0 && (
            <ul className="divide-y divide-[#eceee6]">
              {data.rows.map((row) => (
                <li
                  key={row.agentId}
                  className={`flex items-center gap-4 px-4 py-3 sm:px-6 ${
                    row.agentId === currentAgentId ? "bg-[#eef7de]" : ""
                  }`}
                >
                  <div className="w-9 shrink-0 text-center text-lg font-bold text-ink">
                    {row.rank <= 3 ? MEDALS[row.rank - 1] : row.rank}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold text-ink">
                        {row.agentName}
                        {row.agentId === currentAgentId && (
                          <span className="ml-2 text-xs font-normal text-gray-400">(vi)</span>
                        )}
                      </p>
                      <p className="shrink-0 text-sm text-gray-500">
                        <span className="font-semibold text-ink">{row.totalCalls}</span> klicev ·{" "}
                        <span className="font-semibold text-green-700">
                          {row.successfulCalls}
                        </span>{" "}
                        uspešnih
                      </p>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#eceee6]">
                      <div
                        className="h-full rounded-full bg-accent"
                        style={{
                          width: `${Math.max(
                            4,
                            (row.totalCalls / maxCalls) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
