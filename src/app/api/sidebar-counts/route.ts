import { createClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

// Cache for 30 seconds on the server side - reduces DB load dramatically
export const revalidate = 30;

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Run all 3 queries in PARALLEL (instead of sequential)
  const [approvedRes, inProgressRes, tasksRes] = await Promise.all([
    supabase.from("suppliers").select("*", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("suppliers").select("*", { count: "exact", head: true }).neq("status", "approved"),
    supabase.from("tasks").select("*", { count: "exact", head: true }).neq("status", "completed"),
  ]);

  return NextResponse.json({
    approved: approvedRes.count || 0,
    inProgress: inProgressRes.count || 0,
    tasks: tasksRes.count || 0,
  }, {
    headers: {
      // Browser caches for 30s, then revalidates in background
      "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
    },
  });
}
