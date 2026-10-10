"use client";

import { useCallback, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { EXPECTED_COLUMNS_HINT, mapHeader, type ImportRow } from "@/lib/import-mapping";

interface Props {
  onImported?: () => void;
}

export default function ImportDropzone({ onImported }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [unmatchedColumns, setUnmatchedColumns] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback(async (file: File) => {
    setParsing(true);
    setError(null);
    setResult(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new Error("Datoteka ne vsebuje nobenega delovnega lista.");
      const sheet = workbook.Sheets[sheetName];
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      if (raw.length === 0) {
        throw new Error("Datoteka je prazna ali ni bila prepoznana.");
      }

      const headers = Object.keys(raw[0]);
      const unmatched: string[] = [];
      const headerMap = new Map<string, keyof ImportRow>();
      for (const h of headers) {
        const mapped = mapHeader(h);
        if (mapped) headerMap.set(h, mapped);
        else unmatched.push(h);
      }

      if (headerMap.size === 0) {
        throw new Error(
          `Ni bilo mogoče prepoznati nobenega stolpca. Pričakovani stolpci: ${EXPECTED_COLUMNS_HINT}.`
        );
      }

      const parsedRows: ImportRow[] = raw
        .map((row) => {
          const out: ImportRow = {};
          for (const [header, value] of Object.entries(row)) {
            const mapped = headerMap.get(header);
            if (mapped) {
              const strValue = value === undefined || value === null ? "" : String(value).trim();
              if (strValue) out[mapped] = strValue;
            }
          }
          return out;
        })
        .filter((r) => r.firstName || r.lastName || r.phone || r.company);

      setRows(parsedRows);
      setFileName(file.name);
      setUnmatchedColumns(unmatched);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Napaka pri branju datoteke.");
      setRows([]);
      setFileName(null);
    } finally {
      setParsing(false);
    }
  }, []);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) parseFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }

  async function confirmImport() {
    setImporting(true);
    setError(null);
    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Uvoz ni uspel.");
      setResult(
        `Uvoženih ${data.imported} od ${data.totalRows} vrstic.` +
          (data.skipped > 0 ? ` (${data.skipped} vrstic izpuščenih - prazne.)` : "")
      );
      setRows([]);
      setFileName(null);
      onImported?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Uvoz ni uspel.");
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    setRows([]);
    setFileName(null);
    setUnmatchedColumns([]);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          dragOver ? "border-ink bg-[#eef7de]" : "border-[#d9dbd2] bg-[#f9faf6] hover:bg-[#f4f5f0]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInput}
          className="hidden"
        />
        <p className="text-3xl">📄</p>
        <p className="mt-2 font-medium text-ink">
          Povlecite Excel/CSV datoteko sem ali kliknite za izbiro
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Pričakovani stolpci: {EXPECTED_COLUMNS_HINT}
        </p>
        {parsing && <p className="mt-2 text-sm text-gray-500">Berem datoteko …</p>}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {result && (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{result}</p>
      )}

      {fileName && rows.length > 0 && (
        <div className="mt-4 rounded-xl border border-[#d9dbd2] bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-ink">
              {fileName} — predogled ({rows.length}{" "}
              {rows.length === 1 ? "vrstica" : "vrstic"})
            </p>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="rounded-full border border-[#d9dbd2] px-3 py-1.5 text-xs font-medium hover:bg-[#f4f5f0]"
              >
                Prekliči
              </button>
              <button
                onClick={confirmImport}
                disabled={importing}
                className="rounded-full bg-ink px-4 py-1.5 text-xs font-semibold text-white hover:bg-black disabled:opacity-50"
              >
                {importing ? "Uvažam …" : `Uvozi ${rows.length} kontaktov`}
              </button>
            </div>
          </div>

          {unmatchedColumns.length > 0 && (
            <p className="mt-2 text-xs text-amber-600">
              Neprepoznani stolpci (prezrti): {unmatchedColumns.join(", ")}
            </p>
          )}

          <div className="thin-scroll mt-3 max-h-64 overflow-auto rounded-lg border border-[#eceee6]">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-[#f4f5f0] text-gray-500">
                <tr>
                  <th className="px-3 py-2">Ime</th>
                  <th className="px-3 py-2">Priimek</th>
                  <th className="px-3 py-2">Podjetje</th>
                  <th className="px-3 py-2">Telefon</th>
                  <th className="px-3 py-2">E-pošta</th>
                  <th className="px-3 py-2">Opombe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceee6]">
                {rows.slice(0, 20).map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5">{r.firstName || "—"}</td>
                    <td className="px-3 py-1.5">{r.lastName || "—"}</td>
                    <td className="px-3 py-1.5">{r.company || "—"}</td>
                    <td className="px-3 py-1.5">{r.phone || "—"}</td>
                    <td className="px-3 py-1.5">{r.email || "—"}</td>
                    <td className="px-3 py-1.5">{r.notes || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 20 && (
              <p className="px-3 py-2 text-[11px] text-gray-400">
                … in še {rows.length - 20} vrstic.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
