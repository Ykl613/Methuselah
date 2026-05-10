import { createClient } from "@/lib/supabase-server";
import { sanitizeSearch } from "@/lib/sanitize";
import { NextResponse } from "next/server";

// Whitelisted searchable fields (security: prevents arbitrary SQL field injection)
const SEARCHABLE_FIELDS = new Set([
  "company_name",
  "contact_name",
  "email",
  "phone",
  "reference_code",
  "business_number",
  "company_location",
  "factory_address",
  "product_type",
  "production_quantity",
  "country",
]);

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("role, is_active").eq("id", user.id).single();
  if (!profile || profile.role !== "admin" || !profile.is_active) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const filters: Array<{ field: string; value: string }> = Array.isArray(body.filters) ? body.filters : [];
  const page = Math.max(1, Math.min(10000, parseInt(body.page || "1", 10) || 1));
  const PAGE_SIZE = 25;

  let query = supabase.from("suppliers").select("*", { count: "exact" }).eq("status", "approved");

  // Apply each filter (AND between them — all must match)
  for (const filter of filters) {
    if (!filter || typeof filter.field !== "string" || typeof filter.value !== "string") continue;
    if (!SEARCHABLE_FIELDS.has(filter.field)) continue;
    const value = sanitizeSearch(filter.value.trim());
    if (!value) continue;
    query = query.ilike(filter.field, `%${value}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.order("approved_at", { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    suppliers: data || [],
    count: count || 0,
    page,
    totalPages: Math.max(1, Math.ceil((count || 0) / PAGE_SIZE)),
  });
}
