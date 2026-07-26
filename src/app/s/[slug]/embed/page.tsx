import { getShowcase } from "@/lib/db";
import { CATEGORIES } from "@/lib/types";
import { notFound } from "next/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: `${slug} — gear.show embed` };
}

export default async function EmbedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const showcase = getShowcase(slug);
  if (!showcase) notFound();

  const categoryMap = Object.fromEntries(CATEGORIES.map((c) => [c.value, c]));

  return (
    <div className="bg-ink-900 text-ink-100 p-4 min-h-screen">
      {/* Compact header */}
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-lg font-bold">{showcase.name}</span>
        <span className="text-xs text-ink-300">gear.show</span>
      </div>

      {/* Horizontal scroll row of gear */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {showcase.gear.map((item) => (
          <div
            key={item.id}
            className="flex-shrink-0 w-44 rounded-lg border border-ink-600 bg-ink-700/50 p-3"
          >
            {item.photo ? (
              <div className="mb-2 overflow-hidden rounded">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.photo} alt={item.name} className="h-24 w-full object-cover" />
              </div>
            ) : (
              <div className="mb-2 flex h-24 items-center justify-center rounded bg-ink-800">
                <span className="text-3xl opacity-40">
                  {categoryMap[item.category]?.emoji || "✨"}
                </span>
              </div>
            )}
            <span className="label-tag bg-ink-600 text-ink-200 mb-1.5 inline-flex">
              {categoryMap[item.category]?.emoji} {categoryMap[item.category]?.label}
            </span>
            <h4 className="text-sm font-semibold leading-snug">{item.name}</h4>
            {item.note && (
              <p className="mt-1 text-xs text-ink-200 italic line-clamp-2">"{item.note}"</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}