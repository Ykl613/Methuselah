import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase-server";
import { HeaderActions } from "@/components/HeaderActions";
import { UsersTable } from "./UsersTable";

export default async function Users() {
  const me = await requireAdmin();
  const supabase = createClient();
  const { data: users } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.5px] text-text-primary mb-1">Users</h1>
          <p className="text-[12px] text-text-muted">Manage system users and permissions</p>
        </div>
        <HeaderActions userId={me.id} />
      </div>

      <UsersTable initialUsers={users || []} currentUserId={me.id} />
    </div>
  );
}
