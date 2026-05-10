import { createClient, createServiceClient } from "@/lib/supabase-server";
import { logAudit } from "@/lib/auth";
import { isUuid } from "@/lib/sanitize";
import { NextResponse } from "next/server";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  if (!isUuid(params.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
  if (!profile || profile.role !== "admin" || !profile.is_active) {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  // Get supplier info for audit log before deleting
  const { data: supplier } = await supabase.from("suppliers").select("company_name, email, reference_code").eq("id", params.id).single();
  if (!supplier) return NextResponse.json({ error: "Supplier not found" }, { status: 404 });

  // Use service client to bypass RLS for the cascade delete
  // CASCADE in schema will auto-delete: tasks, supplier_notes, notifications (via FK)
  const service = createServiceClient();
  const { error } = await service.from("suppliers").delete().eq("id", params.id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Log the deletion
  await logAudit({
    actorId: profile.id,
    actorLabel: profile.full_name,
    action: "supplier.deleted",
    entityType: "supplier",
    entityId: params.id,
    entityLabel: supplier.company_name || supplier.reference_code,
    metadata: {
      email: supplier.email,
      reference_code: supplier.reference_code,
      company_name: supplier.company_name,
    },
  });

  return NextResponse.json({ ok: true });
}
