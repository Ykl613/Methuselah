import { createClient } from "./supabase-server";
import { redirect } from "next/navigation";
import crypto from "crypto";

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", user.id).single();
  return profile;
}

export async function requireAuth() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/login");
  if (!profile.is_active) redirect("/login?error=disabled");
  return profile;
}

export async function requireAdmin() {
  const profile = await requireAuth();
  if (profile.role !== "admin") redirect("/my-tasks");
  return profile;
}

export async function logAudit(params: {
  actorId: string | null;
  actorLabel: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityLabel?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = createClient();
  await supabase.from("audit_log").insert({
    actor_id: params.actorId,
    actor_label: params.actorLabel,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId,
    entity_label: params.entityLabel,
    metadata: params.metadata,
  });
}

export function generateReferenceCode(companyName: string): string {
  const prefix = (companyName || "SUP").replace(/[^A-Za-z]/g, "").substring(0, 3).toUpperCase().padEnd(3, "X");
  const year = new Date().getFullYear();
  // crypto.randomInt for unpredictable codes (prevents enumeration of supplier IDs)
  const random = crypto.randomInt(1000, 10000);
  return `${prefix}-${year}-${random}`;
}
