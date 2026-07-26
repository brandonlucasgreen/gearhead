import Database from "better-sqlite3";
import type { Showcase, GearItem } from "./types";
import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "gear-showcase.db");

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (db) return db;
  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  // sync mkdir — better-sqlite3 is sync anyway
  const { mkdirSync } = require("fs");
  mkdirSync(dataDir, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS showcases (
      slug TEXT PRIMARY KEY,
      edit_token TEXT NOT NULL,
      name TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS gear_items (
      id TEXT PRIMARY KEY,
      showcase_slug TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      link TEXT,
      photo TEXT,
      note TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (showcase_slug) REFERENCES showcases(slug) ON DELETE CASCADE
    );
  `);
  return db;
}

export function generateToken(): string {
  return randomBytes(16).toString("hex");
}

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30) || "showcase";
  // Append a short random suffix for uniqueness
  return `${base}-${randomBytes(3).toString("hex")}`;
}

export function createShowcase(data: {
  name: string;
  bio: string;
  gear: Omit<GearItem, "id">[];
}): Showcase {
  const db = getDb();
  const slug = generateSlug(data.name);
  const editToken = generateToken();
  const now = Date.now();

  db.prepare(
    "INSERT INTO showcases (slug, edit_token, name, bio, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(slug, editToken, data.name, data.bio, now, now);

  const insertGear = db.prepare(
    "INSERT INTO gear_items (id, showcase_slug, name, category, link, photo, note, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  );

  data.gear.forEach((item, i) => {
    insertGear.run(
      randomBytes(8).toString("hex"),
      slug,
      item.name,
      item.category,
      item.link || null,
      item.photo || null,
      item.note || null,
      i
    );
  });

  return getShowcase(slug)!;
}

export function getShowcase(slug: string): Showcase | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM showcases WHERE slug = ?").get(slug) as any;
  if (!row) return null;

  const gearRows = db
    .prepare("SELECT * FROM gear_items WHERE showcase_slug = ? ORDER BY position ASC")
    .all(slug) as any[];

  return {
    slug: row.slug,
    editToken: row.edit_token,
    name: row.name,
    bio: row.bio,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    gear: gearRows.map((g) => ({
      id: g.id,
      name: g.name,
      category: g.category,
      link: g.link || undefined,
      photo: g.photo || undefined,
      note: g.note || undefined,
    })),
  };
}

export function getShowcaseByToken(token: string): Showcase | null {
  const db = getDb();
  const row = db.prepare("SELECT slug FROM showcases WHERE edit_token = ?").get(token) as any;
  if (!row) return null;
  return getShowcase(row.slug);
}

export function updateShowcase(
  token: string,
  data: { name?: string; bio?: string; gear?: Omit<GearItem, "id">[] }
): Showcase | null {
  const db = getDb();
  const row = db.prepare("SELECT slug FROM showcases WHERE edit_token = ?").get(token) as any;
  if (!row) return null;
  const slug = row.slug;

  if (data.name !== undefined || data.bio !== undefined) {
    const current = db.prepare("SELECT name, bio FROM showcases WHERE slug = ?").get(slug) as any;
    db.prepare("UPDATE showcases SET name = ?, bio = ?, updated_at = ? WHERE slug = ?").run(
      data.name ?? current.name,
      data.bio ?? current.bio,
      Date.now(),
      slug
    );
  }

  if (data.gear !== undefined) {
    db.prepare("DELETE FROM gear_items WHERE showcase_slug = ?").run(slug);
    const insertGear = db.prepare(
      "INSERT INTO gear_items (id, showcase_slug, name, category, link, photo, note, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    data.gear.forEach((item, i) => {
      insertGear.run(
        randomBytes(8).toString("hex"),
        slug,
        item.name,
        item.category,
        item.link || null,
        item.photo || null,
        item.note || null,
        i
      );
    });
    db.prepare("UPDATE showcases SET updated_at = ? WHERE slug = ?").run(Date.now(), slug);
  }

  return getShowcase(slug);
}

export function deleteShowcase(token: string): boolean {
  const db = getDb();
  const row = db.prepare("SELECT slug FROM showcases WHERE edit_token = ?").get(token) as any;
  if (!row) return false;
  db.prepare("DELETE FROM gear_items WHERE showcase_slug = ?").run(row.slug);
  db.prepare("DELETE FROM showcases WHERE slug = ?").run(row.slug);
  return true;
}