import { createClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/auth";
import { isUuid } from "@/lib/sanitize";
import { NextResponse } from "next/server";

const MAX_NOTE_LENGTH = 2000;

export async function POST(req: Request) {
  const { supplier_id, content } = await req.json();
  if (!supplier_id || !isUuid(supplier_id)) return NextResponse.json({ error: "Invalid supplier_id" }, { status: 400 });
  if (typeof content !== "string" || !content.trim()) return NextResponse.json({ error: "Content required" }, { status: 400 });
  if (content.length > MAX_NOTE_LENGTH) return NextResponse.json({ error: `Note too long (max ${MAX_NOTE_LENGTH} chars)` }, { status: 400 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await supabase.from("supplier_notes").insert({
    supplier_id, author_id: profile.id, content: content.trim(),
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actorId: profile.id, actorLabel: profile.full_name,
    action: "supplier.note_added",
    entityType: "supplier", entityId: supplier_id,
  });

  return NextResponse.json({ ok: true });
}
