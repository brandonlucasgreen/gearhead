export type GearCategory =
  | "instrument"
  | "audio"
  | "software"
  | "effects"
  | "accessory"
  | "other";

export const CATEGORIES: { value: GearCategory; label: string; emoji: string }[] = [
  { value: "instrument", label: "Instrument", emoji: "🎸" },
  { value: "audio", label: "Audio / Interface", emoji: "🔊" },
  { value: "software", label: "Software / Plugin", emoji: "💿" },
  { value: "effects", label: "Effects / Pedals", emoji: "🎛️" },
  { value: "accessory", label: "Accessory", emoji: "🎧" },
  { value: "other", label: "Other", emoji: "✨" },
];

export interface GearItem {
  id: string;
  name: string;
  category: GearCategory;
  link?: string;
  photo?: string; // URL or data URI
  note?: string;
}

export interface Showcase {
  slug: string;
  editToken: string;
  name: string;
  bio: string;
  gear: GearItem[];
  createdAt: number;
  updatedAt: number;
}