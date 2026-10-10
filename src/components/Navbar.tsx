"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAgentCookie, getAgentFromCookie } from "@/lib/agent-cookie";

const LINKS = [
  { href: "/klici", label: "Klicanje" },
  { href: "/lestvica", label: "Lestvica" },
  { href: "/admin", label: "Admin" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [agentName, setAgentName] = useState<string | null>(null);

  useEffect(() => {
    setAgentName(getAgentFromCookie()?.name ?? null);
  }, [pathname]);

  function handleSwitch() {
    clearAgentCookie();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#d9dbd2] bg-ink text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/klici" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="text-accent">●</span>
            <span>ONYX CRM</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {LINKS.map((link) => {
              const active = pathname?.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-accent text-ink"
                      : "text-gray-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {agentName && (
            <span className="hidden text-sm text-gray-300 sm:inline">
              Agent: <span className="font-semibold text-white">{agentName}</span>
            </span>
          )}
          <button
            onClick={handleSwitch}
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/10"
          >
            Zamenjaj agenta
          </button>
        </div>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-white/10 px-4 py-2 sm:hidden">
        {LINKS.map((link) => {
          const active = pathname?.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${
                active ? "bg-accent text-ink" : "text-gray-300 hover:bg-white/10"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
