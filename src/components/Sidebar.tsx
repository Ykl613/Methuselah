"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";
import { useEffect, useState } from "react";

interface SidebarProps {
  user: { id: string; full_name: string; role: string };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [counts, setCounts] = useState({ approved: 0, inProgress: 0, tasks: 0 });

  useEffect(() => {
    let mounted = true;
    const fetchCounts = async () => {
      try {
        const res = await fetch("/api/sidebar-counts");
        if (!res.ok) return;
        const data = await res.json();
        if (mounted) setCounts(data);
      } catch {}
    };
    fetchCounts();
    // Refresh every 60 seconds in the background
    const interval = setInterval(fetchCounts, 60000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  const adminItems = [
    { href: "/dashboard", icon: "ti-layout-grid", label: "Dashboard" },
    { href: "/in-progress", icon: "ti-list-check", label: "Tasks", count: counts.inProgress },
    { href: "/suppliers", icon: "ti-package", label: "Suppliers", count: counts.approved },
  ];
  const adminSubItems = [
    { href: "/users", icon: "ti-users", label: "Users" },
    { href: "/audit", icon: "ti-file-search", label: "Audit Log" },
    { href: "/settings", icon: "ti-settings", label: "Settings" },
  ];
  const employeeItems = [
    { href: "/task-pool", icon: "ti-list-check", label: "Task Pool", count: counts.tasks },
    { href: "/my-tasks", icon: "ti-clipboard-check", label: "My Tasks" },
  ];

  const isActive = (h: string) => pathname === h || pathname.startsWith(h + "/");
  const items = user.role === "admin" ? adminItems : employeeItems;

  return (
    <aside className="w-[240px] bg-white border-r border-border fixed h-screen overflow-y-auto py-5">
      <div className="px-5 pb-5 flex items-center gap-2.5">
        <Logo />
        <span className="text-[15px] font-semibold text-text-primary tracking-tight">Methuselah</span>
      </div>

      <div className="px-3">
        {items.map((item) => (
          <Link key={item.href} href={item.href} prefetch={true}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-ios text-[14px] mb-1 transition-all ${
              isActive(item.href)
                ? "bg-accent-soft text-accent-strong font-semibold"
                : "text-text-secondary hover:bg-bg-elevated"
            }`}>
            <i className={`ti ${item.icon} text-[18px] ${isActive(item.href) ? "text-accent" : "text-text-muted"}`} aria-hidden />
            <span>{item.label}</span>
            {"count" in item && item.count !== undefined && item.count > 0 && (
              <span className={`ml-auto px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                isActive(item.href) ? "bg-accent text-white" : "bg-bg-elevated text-text-muted"
              }`}>
                {item.count}
              </span>
            )}
          </Link>
        ))}

        {user.role === "admin" && (
          <>
            <div className="text-[10px] uppercase tracking-[1.2px] text-text-muted px-3 pt-5 pb-2 font-semibold">
              Admin
            </div>
            {adminSubItems.map((item) => (
              <Link key={item.href} href={item.href} prefetch={true}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-ios text-[14px] mb-1 transition-all ${
                  isActive(item.href)
                    ? "bg-accent-soft text-accent-strong font-semibold"
                    : "text-text-secondary hover:bg-bg-elevated"
                }`}>
                <i className={`ti ${item.icon} text-[18px] ${isActive(item.href) ? "text-accent" : "text-text-muted"}`} aria-hidden />
                {item.label}
              </Link>
            ))}
          </>
        )}
      </div>

      <div className="absolute bottom-4 left-3 right-3 p-3 bg-bg-elevated rounded-ios-lg flex items-center gap-3">
        <div className="avatar avatar-gradient">
          {user.full_name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-text-primary truncate">{user.full_name}</div>
          <div className="text-[11px] text-text-muted capitalize">{user.role}</div>
        </div>
        <form action="/api/logout" method="post">
          <button type="submit" title="Sign out" className="text-text-muted hover:text-red w-8 h-8 rounded-full hover:bg-red-soft flex items-center justify-center transition-all">
            <i className="ti ti-logout text-[16px]" aria-hidden />
          </button>
        </form>
      </div>
    </aside>
  );
}
