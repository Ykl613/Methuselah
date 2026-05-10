import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { NotificationBell } from "@/components/NotificationBell";
import { UsersTable } from "./UsersTable";

export default async function Users() {
  const me = await requireAdmin();
  const supabase = createClient();
  const { data: users } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary mb-0.5">Users</h1>
          <p className="text-xs text-text-muted">Manage system users and permissions</p>
        </div>
        <div className="flex gap-2 items-center">
          <NotificationBell userId={me.id} />
        </div>
      </div>

      <UsersTable initialUsers={users || []} currentUserId={me.id} />
    </div>
  );
}
