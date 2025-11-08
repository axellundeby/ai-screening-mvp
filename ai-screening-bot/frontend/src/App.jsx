import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, FileText, Trash2, Settings2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function AIScreeningMVP() {
  const [files, setFiles] = useState([]);
  const [qualities, setQualities] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [useBackend, setUseBackend] = useState(true); // backend mode default ON

  const pdfFiles = useMemo(
    () => files.filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")),
    [files]
  );

  function onAddFiles(newFiles) {
    if (!newFiles) return;
    const list = Array.from(newFiles);
    const deduped = dedupeByName([...files, ...list]);
    setFiles(deduped);
  }

  function removeFile(name) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function handleSubmit(e) {
    e?.preventDefault();
    setError(null);
    setResults([]);

    if (pdfFiles.length === 0) {
      setError("Please add at least one PDF CV.");
      return;
    }
    if (!qualities.trim()) {
      setError("Please enter the desired candidate qualities.");
      return;
    }

    setLoading(true);
    try {
      const res = useBackend
        ? await apiRankCandidates(pdfFiles, qualities)
        : await mockRankCandidates(pdfFiles, qualities);
      setResults(res);
    } catch (err) {
      setError(err?.message || "Something went wrong while ranking candidates.");
    } finally {
      setLoading(false);
    }
  }

  function resetAll() {
    setFiles([]);
    setQualities("");
    setResults([]);
    setError(null);
  }

  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-4xl px-4 sm:px-6 lg:px-10 py-10 mx-auto">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              AI Screening Bot – MVP
            </h1>
            <p className="text-sm text-gray-600">
              Upload CV PDFs, enter desired qualities, then rank.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="use-backend" className="text-sm text-gray-700">
                Use backend
              </Label>
              <Switch id="use-backend" checked={useBackend} onCheckedChange={setUseBackend} />
            </div>
            <Button variant="secondary" onClick={resetAll}>
              Reset
            </Button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-5">
          {/* File Upload */}
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Upload className="h-4 w-4" /> Upload CVs (PDF, multiple)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <label
                htmlFor="file-input"
                className="mb-3 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center transition hover:border-gray-400"
              >
                <div className="pointer-events-none flex flex-col items-center gap-2">
                  <Upload className="h-6 w-6" />
                  <p className="text-sm text-gray-700">
                    Drag & drop your PDF CVs here, or{" "}
                    <span className="font-medium underline">browse</span>
                  </p>
                </div>
                <Input
                  id="file-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  multiple
                  onChange={(e) => onAddFiles(e.target.files)}
                  className="hidden"
                />
              </label>

              <div className="mt-4 space-y-2">
                <AnimatePresence initial={false}>
                  {pdfFiles.map((f) => (
                    <motion.div
                      key={f.name}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center justify-between rounded-xl border bg-white p-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <FileText className="h-4 w-4 shrink-0" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{f.name}</p>
                          <p className="text-xs text-gray-500">{formatBytes(f.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(f.name)}
                        aria-label={`Remove ${f.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {pdfFiles.length === 0 && (
                  <p className="text-xs text-gray-500">No files added yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Qualities input */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings2 className="h-4 w-4" /> Desired Qualities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter one quality per line..."
                value={qualities}
                onChange={(e) => setQualities(e.target.value)}
                className="min-h-[180px] w-full"
              />
              <div className="mt-4 flex items-center justify-between">
  
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ranking…
                    </>
                  ) : (
                    "Go"
                  )}
                </Button>
              </div>
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </CardContent>
          </Card>
        </form>

        {/* Results */}
        <section className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ranked Candidates</CardTitle>
            </CardHeader>
            <CardContent>
  {results.length === 0 ? (
    <p className="text-sm text-gray-600">
      Results will appear here after you click Go.
    </p>
  ) : (
    <div className="overflow-hidden rounded-xl border">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Rank
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Candidate
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Score
            </th>
            <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              CV
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {results.map((r, idx) => (
            <tr key={r.id}>
              <td className="whitespace-nowrap px-4 py-2 text-sm font-medium">
                {idx + 1}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-sm">
                {r.name}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-sm">
                {Math.round(r.score)} / 100
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-right text-sm">
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="underline text-blue-600"
                  >
                    Open CV
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )}
</CardContent>

          </Card>
        </section>
      </div>
    </div>
  );
}

/* ---------------- Helpers ---------------- */

function dedupeByName(list) {
  const seen = new Set();
  const out = [];
  for (const f of list) {
    if (seen.has(f.name)) continue;
    seen.add(f.name);
    out.push(f);
  }
  return out;
}

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function seededHash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0);
}

async function mockRankCandidates(files, qualities) {
  await new Promise((r) => setTimeout(r, 800));
  const qualityTerms = qualities.split(/[\n,•\-]+/).map((s) => s.trim()).filter(Boolean);

  const ranked = await Promise.all(
    files.map(async (f) => {
      const name = f.name.replace(/\.pdf$/i, "");
      const seed = seededHash(name + "::" + qualities);
      const base = (seed % 100) * 0.7 + 30;
      const bonus = Math.min(qualityTerms.length * 2, 20);
      const score = Math.max(0, Math.min(100, base + bonus));
      const url = URL.createObjectURL(f);
      const notes = qualityTerms.length
        ? `Matched on: ${qualityTerms.slice(0, 4).join(", ")}${
            qualityTerms.length > 4 ? "…" : ""
          }`
        : "No qualities provided";
      return { id: seed.toString(), name, score, notes, url };
    })
  );

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

async function apiRankCandidates(files, qualities) {
  const form = new FormData();
  const base = (name) => name.replace(/\.pdf$/i, "");
  const urlByName = new Map();

  files.forEach((f) => {
    form.append("files", f, f.name);
    urlByName.set(base(f.name), URL.createObjectURL(f));
  });
  form.append("qualities", qualities);

  // Use full backend URL (change if using proxy)
  const res = await fetch("http://localhost:8000/api/screen", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `API error: ${res.status}`);
  }

  const data = await res.json();
  const cleaned = data
    .map((r) => ({
      ...r,
      score: Math.max(0, Math.min(100, Number(r.score) || 0)),
      url: urlByName.get(r.name) || null,
    }))
    .sort((a, b) => b.score - a.score);

  return cleaned;
}
