"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import ImportDropzone from "@/components/ImportDropzone";
import AgentManager from "@/components/AgentManager";
import ContactsTable from "@/components/ContactsTable";
import OverviewStats from "@/components/OverviewStats";
import { fetchCurrentAgent } from "@/lib/session-client";

const TABS = [
  { id: "pregled", label: "📊 Pregled" },
  { id: "uvoz", label: "📄 Uvoz" },
  { id: "agenti", label: "🧑‍💼 Agenti" },
  { id: "kontakti", label: "📇 Kontakti" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [tab, setTab] = useState<TabId>("pregled");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchCurrentAgent().then((agent) => {
      if (!agent) {
        router.replace("/");
        return;
      }
      if (!agent.isAdmin) {
        router.replace("/klici");
        return;
      }
      setAllowed(true);
    });
  }, [router]);

  function bump() {
    setRefreshKey((k) => k + 1);
  }

  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-[#f4f5f0]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <h1 className="text-xl font-bold text-ink">Admin nadzorna plošča</h1>
        <p className="mt-1 text-sm text-gray-500">
          Uvoz kontaktov, upravljanje agentov in pregled baze.
        </p>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-ink text-white"
                  : "border border-[#d9dbd2] bg-white text-gray-600 hover:bg-[#f4f5f0]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {tab === "pregled" && <OverviewStats refreshKey={refreshKey} />}

          {tab === "uvoz" && (
            <div className="rounded-2xl border border-[#d9dbd2] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-bold text-ink">Uvoz kontaktov</h2>
              <p className="mt-1 text-sm text-gray-500">
                Povlecite Excel (.xlsx) ali CSV datoteko s kontakti za klicanje.
              </p>
              <div className="mt-4">
                <ImportDropzone onImported={bump} />
              </div>
            </div>
          )}

          {tab === "agenti" && <AgentManager />}

          {tab === "kontakti" && <ContactsTable refreshKey={refreshKey} />}
        </div>
      </main>
    </div>
  );
}
