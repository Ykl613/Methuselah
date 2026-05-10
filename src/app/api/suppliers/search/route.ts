import { createClient } from "@/lib/supabase-server";
import { sanitizeSearch } from "@/lib/sanitize";
import { NextResponse } from "next/server";

const SEARCHABLE_FIELDS = new Set([
  "company_name", "contact_name", "email", "phone", "reference_code",
  "business_number", "company_location", "factory_address",
  "product_type", "production_quantity", "country",
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

  for (const filter of filters) {
    if (!filter || typeof filter.field !== "string" || typeof filter.value !== "string") continue;
    if (!SEARCHABLE_FIELDS.has(filter.field)) continue;
    const value = sanitizeSearch(filter.value.trim());
    if (!value) continue;
    query = query.ilike(filter.field, `%${value}%`);
  }

  // We need to fetch ALL matching suppliers to sort by follow-up status first,
  // then paginate. Limit to 1000 to avoid memory issues.
  query = query.order("approved_at", { ascending: false }).range(0, 999);
  const { data: allSuppliers, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch open follow-up counts for these suppliers
  const supplierIds = (allSuppliers || []).map((s: any) => s.id);
  let followUpMap: Record<string, number> = {};
  if (supplierIds.length > 0) {
    const { data: followUps } = await supabase
      .from("supplier_follow_up_tasks")
      .select("supplier_id")
      .in("supplier_id", supplierIds)
      .eq("status", "open");
    (followUps || []).forEach((f: any) => {
      followUpMap[f.supplier_id] = (followUpMap[f.supplier_id] || 0) + 1;
    });
  }

  // Enrich and sort: suppliers with open follow-ups come first
  const enriched = (allSuppliers || []).map((s: any) => ({
    ...s,
    open_follow_ups: followUpMap[s.id] || 0,
  }));

  enriched.sort((a: any, b: any) => {
    // Suppliers with open follow-ups first
    if (a.open_follow_ups > 0 && b.open_follow_ups === 0) return -1;
    if (a.open_follow_ups === 0 && b.open_follow_ups > 0) return 1;
    // Then by approved date (newest first)
    if (a.approved_at && b.approved_at) return new Date(b.approved_at).getTime() - new Date(a.approved_at).getTime();
    return 0;
  });

  // Paginate after sorting
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;
  const paginated = enriched.slice(from, to);

  return NextResponse.json({
    suppliers: paginated,
    count: count || 0,
    page,
    totalPages: Math.max(1, Math.ceil((count || 0) / PAGE_SIZE)),
  });
}
