import { createClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/auth";
import { isUuid } from "@/lib/sanitize";
import { NextResponse } from "next/server";

const MAX_EVAL_LEN = 200;

function clean(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, MAX_EVAL_LEN);
  return t || null;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin" || !profile.is_active) return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const { data: supplier } = await supabase.from("suppliers").select("company_name").eq("id", params.id).single();
  if (!supplier) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const update = {
    quality_rating: clean(body.quality_rating),
    reliability_score: clean(body.reliability_score),
    pricing_tier: clean(body.pricing_tier),
    communication: clean(body.communication),
  };

  const { error } = await supabase.from("suppliers").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await logAudit({
    actorId: profile.id, actorLabel: profile.full_name,
    action: "supplier.evaluation_updated",
    entityType: "supplier", entityId: params.id, entityLabel: supplier.company_name,
  });

  return NextResponse.json({ ok: true });
}
