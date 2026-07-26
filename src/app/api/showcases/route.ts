import { NextRequest, NextResponse } from "next/server";
import { createShowcase, getShowcaseByToken, updateShowcase, deleteShowcase } from "@/lib/db";

// POST — create a new showcase
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, bio, gear } = body as {
      name?: string;
      bio?: string;
      gear?: { name: string; category: string; link?: string; note?: string; photo?: string }[];
    };

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const showcase = createShowcase({
      name: name.trim(),
      bio: (bio || "").trim(),
      gear: (gear || []).filter((g) => g.name && g.name.trim()).map((g) => ({
        name: g.name.trim(),
        category: g.category as any,
        link: g.link?.trim() || undefined,
        note: g.note?.trim() || undefined,
        photo: g.photo?.trim() || undefined,
      })),
    });

    return NextResponse.json({
      slug: showcase.slug,
      editToken: showcase.editToken,
    });
  } catch (err) {
    console.error("Create showcase error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// GET — fetch a showcase by edit token (for the edit page)
export async function GET(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }
  const showcase = getShowcaseByToken(token);
  if (!showcase) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    slug: showcase.slug,
    name: showcase.name,
    bio: showcase.bio,
    gear: showcase.gear,
  });
}

// PUT — update a showcase by edit token
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, name, bio, gear } = body;

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const updated = updateShowcase(token, {
      name: name?.trim(),
      bio: bio?.trim(),
      gear: gear
        ?.filter((g: any) => g.name && g.name.trim())
        .map((g: any) => ({
          name: g.name.trim(),
          category: g.category,
          link: g.link?.trim() || undefined,
          photo: g.photo?.trim() || undefined,
          note: g.note?.trim() || undefined,
        })),
    });

    if (!updated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, slug: updated.slug });
  } catch (err) {
    console.error("Update error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// DELETE — delete a showcase by edit token
export async function DELETE(req: NextRequest) {
  const token = new URL(req.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }
  const ok = deleteShowcase(token);
  if (!ok) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}