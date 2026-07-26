import { getShowcase } from "@/lib/db";
import { CATEGORIES } from "@/lib/types";
import { notFound } from "next/navigation";
import GearCard from "@/components/GearCard";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const showcase = getShowcase(slug);
  if (!showcase) return { title: "Not found — gear.show" };
  return {
    title: `${showcase.name}'s gear — gear.show`,
    description: showcase.bio || `${showcase.name}'s gear setup`,
  };
}

export default async function ShowcasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const showcase = getShowcase(slug);
  if (!showcase) notFound();

  const categoryMap = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

  return (
    <main className="min-h-screen bg-ink-900">
      {/* Header section */}
      <div className="border-b border-ink-600">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:py-20 animate-fade-in">
          <div className="mb-1 flex items-center gap-2 text-xs text-ink-300">
            <span className="label-tag bg-ink-700 text-ink-200">
              gear.show
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            {showcase.name}
          </h1>
          {showcase.bio && (
            <p className="mt-3 text-lg text-ink-200 max-w-xl leading-relaxed">
              {showcase.bio}
            </p>
          )}
          <div className="mt-4 flex items-center gap-3 text-xs text-ink-300">
            <span>{showcase.gear.length} items</span>
            <span>·</span>
            <span>
              Updated {new Date(showcase.updatedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Gear grid */}
      <div className="mx-auto max-w-3xl px-4 py-12">
        {showcase.gear.length === 0 ? (
          <p className="text-center text-ink-300 py-20">
            No gear listed yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {showcase.gear.map((item, i) => (
              <GearCard
                key={item.id}
                item={item}
                categoryLabel={categoryMap[item.category]?.label || item.category}
                categoryEmoji={categoryMap[item.category]?.emoji || "✨"}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-ink-600 py-8 text-center">
        <a
          href="/"
          className="text-xs text-ink-300 hover:text-accent transition-colors"
        >
          Make your own gear showcase →
        </a>
      </footer>
    </main>
  );
}