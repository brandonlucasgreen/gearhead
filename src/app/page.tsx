"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, type GearCategory } from "@/lib/types";

interface DraftGearItem {
  id: string;
  name: string;
  category: GearCategory;
  link: string;
  note: string;
}

let _id = 0;
const tmpId = () => `tmp-${++_id}`;

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [gear, setGear] = useState<DraftGearItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function addGear() {
    setGear((g) => [
      ...g,
      { id: tmpId(), name: "", category: "instrument", link: "", note: "" },
    ]);
  }

  function updateGear(id: string, field: keyof DraftGearItem, value: string) {
    setGear((g) =>
      g.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  function removeGear(id: string) {
    setGear((g) => g.filter((item) => item.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/showcases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          bio: bio.trim(),
          gear: gear
            .filter((g) => g.name.trim())
            .map((g) => ({
              name: g.name.trim(),
              category: g.category,
              link: g.link.trim() || undefined,
              note: g.note.trim() || undefined,
            })),
        }),
      });
      if (!res.ok) throw new Error("Failed to create showcase");
      const data = await res.json();
      router.push(`/edit/${data.editToken}?created=1`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12 sm:py-20">
      {/* Header */}
      <div className="mb-12 animate-fade-in">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-3xl">🎸</span>
          <h1 className="text-3xl font-bold tracking-tight">
            gear<span className="text-accent">.show</span>
          </h1>
        </div>
        <p className="text-ink-200 text-sm">
          Show off your rig. Get a link and an embed. No signup.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 animate-slide-up">
        {/* Identity */}
        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-300">
            Who are you
          </h2>
          <div>
            <label className="mb-1 block text-sm text-ink-200">Name / Handle</label>
            <input
              className="input-field"
              placeholder="e.g. Sarah Lo-Fi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-ink-200">
              Bio <span className="text-ink-300">(optional)</span>
            </label>
            <textarea
              className="input-field min-h-[80px] resize-y"
              placeholder="Producer, guitarist, maker of weird sounds in Brooklyn."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              maxLength={300}
            />
          </div>
        </section>

        {/* Gear */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-300">
              Your Gear
            </h2>
            <button
              type="button"
              onClick={addGear}
              className="btn-ghost text-sm"
            >
              + Add item
            </button>
          </div>

          {gear.length === 0 && (
            <div className="rounded-lg border border-dashed border-ink-500 p-8 text-center">
              <p className="text-ink-300 text-sm">
                No gear yet. Click "Add item" to start listing your setup.
              </p>
            </div>
          )}

          {gear.map((item) => (
            <div
              key={item.id}
              className="gear-card space-y-3 animate-slide-up"
            >
              <div className="flex items-start justify-between gap-2">
                <input
                  className="input-field"
                  placeholder="1962 Fender Stratocaster"
                  value={item.name}
                  onChange={(e) => updateGear(item.id, "name", e.target.value)}
                  maxLength={100}
                />
                <button
                  type="button"
                  onClick={() => removeGear(item.id)}
                  className="mt-1 text-ink-300 hover:text-red-400 transition-colors text-lg"
                  aria-label="Remove"
                >
                  ×
                </button>
              </div>
              <div className="flex gap-2">
                <select
                  className="input-field w-auto"
                  value={item.category}
                  onChange={(e) => updateGear(item.id, "category", e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.emoji} {c.label}
                    </option>
                  ))}
                </select>
                <input
                  className="input-field"
                  placeholder="Link (optional)"
                  value={item.link}
                  onChange={(e) => updateGear(item.id, "link", e.target.value)}
                />
              </div>
              <input
                className="input-field"
                placeholder="Personal note (optional) — e.g. 'My main axe since 2019'"
                value={item.note}
                onChange={(e) => updateGear(item.id, "note", e.target.value)}
                maxLength={200}
              />
            </div>
          ))}
        </section>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !name.trim()}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Creating..." : "Create showcase →"}
        </button>
      </form>

      <footer className="mt-16 text-center text-xs text-ink-300">
        No accounts. No tracking. Just gear.
      </footer>
    </main>
  );
}