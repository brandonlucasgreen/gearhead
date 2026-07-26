import { CATEGORIES, type GearItem } from "@/lib/types";

interface GearCardProps {
  item: GearItem;
  categoryLabel: string;
  categoryEmoji: string;
  index: number;
}

export default function GearCard({ item, categoryLabel, categoryEmoji, index }: GearCardProps) {
  return (
    <div
      className="gear-card group animate-slide-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Photo or category emoji */}
      {item.photo ? (
        <div className="mb-4 overflow-hidden rounded-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.photo}
            alt={item.name}
            className="h-40 w-full object-cover"
          />
        </div>
      ) : (
        <div className="mb-4 flex h-40 items-center justify-center rounded-md bg-ink-800">
          <span className="text-5xl opacity-40">{categoryEmoji}</span>
        </div>
      )}

      {/* Category tag */}
      <div className="mb-2 flex items-center gap-2">
        <span className="label-tag bg-ink-600 text-ink-200">
          {categoryEmoji} {categoryLabel}
        </span>
      </div>

      {/* Name */}
      <h3 className="text-lg font-semibold text-ink-100 leading-snug">
        {item.name}
      </h3>

      {/* Note */}
      {item.note && (
        <p className="mt-2 text-sm text-ink-200 italic leading-relaxed">
          "{item.note}"
        </p>
      )}

      {/* Link */}
      {item.link && (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-xs text-accent hover:text-accent-dim transition-colors"
        >
          View →
        </a>
      )}
    </div>
  );
}