import { createClient, type Client } from "@libsql/client";
import type { Showcase, GearItem } from "./types";
import { randomBytes } from "crypto";
import path from "path";

// ---------------------------------------------------------------------------
// Database client
// ---------------------------------------------------------------------------
// In production (Netlify), use Turso (libSQL) with env vars.
// In development, use a local SQLite file via libSQL's local mode.
// ---------------------------------------------------------------------------

let client: Client | null = null;

function getClient(): Client {
  if (client) return client;

  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoAuthToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) {
    // Production: Turso remote database
    client = createClient({
      url: tursoUrl,
      authToken: tursoAuthToken || undefined,
    });
  } else {
    // Development: local SQLite file via libSQL
    const { mkdirSync } = require("fs");
    const dbPath = path.join(process.cwd(), "data", "gear-showcase.db");
    mkdirSync(path.dirname(dbPath), { recursive: true });
    client = createClient({ url: `file:${dbPath}` });
  }

  return client;
}

// ---------------------------------------------------------------------------
// Schema initialisation (idempotent)
// ---------------------------------------------------------------------------

let initialised = false;

async function ensureSchema(): Promise<void> {
  if (initialised) return;
  const c = getClient();
  await c.execute(`
    CREATE TABLE IF NOT EXISTS showcases (
      slug TEXT PRIMARY KEY,
      edit_token TEXT NOT NULL,
      name TEXT NOT NULL,
      bio TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
  await c.execute(`
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
  initialised = true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function generateToken(): string {
  return randomBytes(16).toString("hex");
}

export function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30) || "showcase";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

function rowToGearItem(g: any): GearItem {
  return {
    id: g.id,
    name: g.name,
    category: g.category,
    link: g.link || undefined,
    photo: g.photo || undefined,
    note: g.note || undefined,
  };
}

function rowToShowcase(row: any, gearRows: any[]): Showcase {
  return {
    slug: row.slug,
    editToken: row.edit_token,
    name: row.name,
    bio: row.bio,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    gear: gearRows.map(rowToGearItem),
  };
}

// ---------------------------------------------------------------------------
// Public API (async)
// ---------------------------------------------------------------------------

export async function createShowcase(data: {
  name: string;
  bio: string;
  gear: Omit<GearItem, "id">[];
}): Promise<Showcase> {
  await ensureSchema();
  const c = getClient();
  const slug = generateSlug(data.name);
  const editToken = generateToken();
  const now = Date.now();

  await c.execute({
    sql: "INSERT INTO showcases (slug, edit_token, name, bio, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
    args: [slug, editToken, data.name, data.bio, now, now],
  });

  for (let i = 0; i < data.gear.length; i++) {
    const item = data.gear[i];
    await c.execute({
      sql: "INSERT INTO gear_items (id, showcase_slug, name, category, link, photo, note, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      args: [
        randomBytes(8).toString("hex"),
        slug,
        item.name,
        item.category,
        item.link || null,
        item.photo || null,
        item.note || null,
        i,
      ],
    });
  }

  const result = await getShowcase(slug);
  return result!;
}

export async function getShowcase(slug: string): Promise<Showcase | null> {
  await ensureSchema();
  const c = getClient();

  const res = await c.execute({
    sql: "SELECT * FROM showcases WHERE slug = ?",
    args: [slug],
  });
  if (res.rows.length === 0) return null;
  const row = res.rows[0];

  const gearRes = await c.execute({
    sql: "SELECT * FROM gear_items WHERE showcase_slug = ? ORDER BY position ASC",
    args: [slug],
  });

  return rowToShowcase(row, gearRes.rows);
}

export async function getShowcaseByToken(token: string): Promise<Showcase | null> {
  await ensureSchema();
  const c = getClient();

  const res = await c.execute({
    sql: "SELECT slug FROM showcases WHERE edit_token = ?",
    args: [token],
  });
  if (res.rows.length === 0) return null;
  return getShowcase(res.rows[0].slug as string);
}

export async function updateShowcase(
  token: string,
  data: { name?: string; bio?: string; gear?: Omit<GearItem, "id">[] }
): Promise<Showcase | null> {
  await ensureSchema();
  const c = getClient();

  const res = await c.execute({
    sql: "SELECT slug FROM showcases WHERE edit_token = ?",
    args: [token],
  });
  if (res.rows.length === 0) return null;
  const slug = res.rows[0].slug as string;

  if (data.name !== undefined || data.bio !== undefined) {
    const current = await c.execute({
      sql: "SELECT name, bio FROM showcases WHERE slug = ?",
      args: [slug],
    });
    const cur = current.rows[0];
    await c.execute({
      sql: "UPDATE showcases SET name = ?, bio = ?, updated_at = ? WHERE slug = ?",
      args: [data.name ?? cur.name, data.bio ?? cur.bio, Date.now(), slug],
    });
  }

  if (data.gear !== undefined) {
    await c.execute({
      sql: "DELETE FROM gear_items WHERE showcase_slug = ?",
      args: [slug],
    });
    for (let i = 0; i < data.gear.length; i++) {
      const item = data.gear[i];
      await c.execute({
        sql: "INSERT INTO gear_items (id, showcase_slug, name, category, link, photo, note, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        args: [
          randomBytes(8).toString("hex"),
          slug,
          item.name,
          item.category,
          item.link || null,
          item.photo || null,
          item.note || null,
          i,
        ],
      });
    }
    await c.execute({
      sql: "UPDATE showcases SET updated_at = ? WHERE slug = ?",
      args: [Date.now(), slug],
    });
  }

  return getShowcase(slug);
}

export async function deleteShowcase(token: string): Promise<boolean> {
  await ensureSchema();
  const c = getClient();

  const res = await c.execute({
    sql: "SELECT slug FROM showcases WHERE edit_token = ?",
    args: [token],
  });
  if (res.rows.length === 0) return false;
  const slug = res.rows[0].slug as string;

  await c.execute({
    sql: "DELETE FROM gear_items WHERE showcase_slug = ?",
    args: [slug],
  });
  await c.execute({
    sql: "DELETE FROM showcases WHERE slug = ?",
    args: [slug],
  });
  return true;
}