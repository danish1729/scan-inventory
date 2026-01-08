"use client";

import { Role } from "@/types";
import { Sidebar } from "./SideBar";
import { BottomNav } from "./BottomNav";

interface DashboardShellProps {
  children: React.ReactNode;
  role: Role;
}

export function DashboardShell({ children, role }: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop Sidebar (Hidden on Mobile) */}
      <Sidebar role={role} />

      {/* Main Content Area */}
      {/* md:pl-64 adds left padding on desktop to make room for sidebar */}
      {/* pb-24 adds bottom padding on mobile for the nav bar */}
      <main className="md:pl-64 pb-24 md:pb-0 min-h-screen transition-all">
        <div className="max-w-5xl mx-auto w-full">{children}</div>
      </main>

      {/* Mobile Bottom Nav (Hidden on Desktop) */}
      <BottomNav role={role} />
    </div>
  );
}
