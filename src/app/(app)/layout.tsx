import { requireAuth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuth();
  return (
    <div className="flex min-h-screen bg-bg-base">
      <Sidebar user={{ id: user.id, full_name: user.full_name, role: user.role }} />
      <main className="flex-1 ml-[240px] p-7">{children}</main>
    </div>
  );
}
