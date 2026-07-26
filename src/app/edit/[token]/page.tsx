"use client";

import { useState, useEffect, use } from "react";
import { CATEGORIES, type GearCategory } from "@/lib/types";

interface DraftGearItem {
  id: string;
  name: string;
  category: GearCategory;
  link: string;
  note: string;
  photo: string;
}

let _id = 0;
const tmpId = () => `tmp-${++_id}`;

export default function EditPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [gear, setGear] = useState<DraftGearItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [publicSlug, setPublicSlug] = useState("");
  const [justCreated, setJustCreated] = useState(false);

  useEffect(() => {
    // Check if just created (URL param handled via window)
    const params = new URLSearchParams(window.location.search);
    if (params.get("created") === "1") setJustCreated(true);

    fetch(`/api/showcases?token=${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setName(data.name);
        setBio(data.bio);
        setPublicSlug(data.slug);
        setGear(
          data.gear.map((g: any) => ({
            id: g.id || tmpId(),
            name: g.name,
            category: g.category,
            link: g.link || "",
            note: g.note || "",
            photo: g.photo || "",
          }))
        );
        setLoading(false);
      })
      .catch(() => {
        setError("Showcase not found");
        setLoading(false);
      });
  }, [token]);

  function addGear() {
    setGear((g) => [
      ...g,
      { id: tmpId(), name: "", category: "instrument", link: "", note: "", photo: "" },
    ]);
  }

  function updateGear(id: string, field: keyof DraftGearItem, value: string) {
    setGear((g) => g.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  function removeGear(id: string) {
    setGear((g) => g.filter((item) => item.id !== id));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/showcases", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          name: name.trim(),
          bio: bio.trim(),
          gear: gear
            .filter((g) => g.name.trim())
            .map((g) => ({
              name: g.name.trim(),
              category: g.category,
              link: g.link.trim() || undefined,
              note: g.note.trim() || undefined,
              photo: g.photo.trim() || undefined,
            })),
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setJustCreated(false);
      setSaving(false);
    } catch {
      setError("Failed to save");
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center text-ink-300">
        Loading...
      </main>
    );
  }

  if (error && !name) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-20 text-center">
        <p className="text-red-400">{error}</p>
      </main>
    );
  }

  const publicUrl = publicSlug ? `/s/${publicSlug}` : "";
  const embedUrl = publicSlug ? `/s/${publicSlug}/embed` : "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit showcase</h1>
        {publicSlug && (
          <a
            href={publicUrl}
            target="_blank"
            className="btn-ghost text-sm"
          >
            View public page →
          </a>
        )}
      </div>

      {/* Just created banner */}
      {justCreated && publicSlug && (
        <div className="mb-6 rounded-lg border border-accent/30 bg-accent/10 p-4 animate-slide-up">
          <p className="text-sm text-ink-100 mb-3">
            <span className="font-semibold text-accent">Your showcase is live!</span> Save these links:
          </p>
          <div className="space-y-2 text-sm">
            <div>
              <span className="text-ink-300">Public page: </span>
              <code className="text-accent break-all">{origin}{publicUrl}</code>
            </div>
            <div>
              <span className="text-ink-300">Edit link (keep this safe!): </span>
              <code className="text-accent break-all">{origin}/edit/{token}</code>
            </div>
            <div>
              <span className="text-ink-300">Embed: </span>
              <code className="text-accent break-all">{origin}{embedUrl}</code>
            </div>
          </div>
          <div className="mt-3 rounded-md bg-ink-800 p-2">
            <code className="text-xs text-ink-200 break-all">
              {`<iframe src="${origin}${embedUrl}" width="100%" height="400" frameborder="0" style="border:none;border-radius:8px;overflow:hidden;"></iframe>`}
            </code>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
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
            <label className="mb-1 block text-sm text-ink-200">Bio</label>
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
              Your Gear ({gear.length})
            </h2>
            <button type="button" onClick={addGear} className="btn-ghost text-sm">
              + Add item
            </button>
          </div>

          {gear.map((item) => (
            <div key={item.id} className="gear-card space-y-3 animate-slide-up">
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
                placeholder="Photo URL (optional)"
                value={item.photo}
                onChange={(e) => updateGear(item.id, "photo", e.target.value)}
              />
              <input
                className="input-field"
                placeholder="Personal note (optional)"
                value={item.note}
                onChange={(e) => updateGear(item.id, "note", e.target.value)}
                maxLength={200}
              />
            </div>
          ))}

          {gear.length === 0 && (
            <div className="rounded-lg border border-dashed border-ink-500 p-8 text-center">
              <p className="text-ink-300 text-sm">No gear yet. Click "Add item" to start.</p>
            </div>
          )}
        </section>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      {/* Embed snippet (always visible after first load) */}
      {!justCreated && publicSlug && (
        <div className="mt-12 rounded-lg border border-ink-600 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-300 mb-2">
            Embed snippet
          </h3>
          <div className="rounded-md bg-ink-800 p-2 overflow-x-auto">
            <code className="text-xs text-ink-200 whitespace-pre">
              {`<iframe src="${origin}${embedUrl}" width="100%" height="400" frameborder="0" style="border:none;border-radius:8px;overflow:hidden;"></iframe>`}
            </code>
          </div>
        </div>
      )}

      {/* Danger zone */}
      {!justCreated && (
        <div className="mt-8 pt-8 border-t border-ink-600">
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Delete this showcase permanently? This cannot be undone.")) return;
              const res = await fetch(`/api/showcases?token=${token}`, { method: "DELETE" });
              if (res.ok) window.location.href = "/";
            }}
            className="text-xs text-ink-300 hover:text-red-400 transition-colors"
          >
            Delete showcase
          </button>
        </div>
      )}
    </main>
  );
}