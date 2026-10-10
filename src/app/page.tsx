"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("Vnesite uporabniško ime in geslo.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Napaka pri prijavi.");
        return;
      }
      router.push("/klici");
      router.refresh();
    } catch {
      setError("Napaka pri povezavi s strežnikom.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f4f5f0] px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-xl font-bold text-accent">
            O
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-ink">ONYX CRM</h1>
          <p className="mt-1 text-sm text-gray-500">
            Prijavite se s svojim uporabniškim računom.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#d9dbd2] bg-white p-5 shadow-sm"
        >
          <label className="block text-xs font-medium text-gray-500">
            Uporabniško ime
          </label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            className="mt-1 mb-3 w-full rounded-lg border border-[#d9dbd2] px-3 py-2 text-sm outline-none focus:border-ink"
            placeholder="npr. nik.ribic"
          />
          <label className="block text-xs font-medium text-gray-500">Geslo</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-[#d9dbd2] px-3 py-2 text-sm outline-none focus:border-ink"
            placeholder="••••••••"
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-black disabled:opacity-50"
          >
            {loading ? "Prijavljam …" : "Prijava"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Uporabniško ime in geslo dodeli administrator v Admin → Agenti.
        </p>
      </div>
    </main>
  );
}
