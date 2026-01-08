"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Scan, ScrollText, Menu } from "lucide-react";
import { Role } from "@/types";

export function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  // Class to HIDE on Desktop (md:hidden)
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 md:hidden safe-area-pb">
      {/* 1. Scanner (Everyone) */}
      <Link
        href="/scan"
        className={`flex flex-col items-center gap-1 transition-colors ${
          isActive("/scan") ? "text-blue-600" : "text-slate-400"
        }`}
      >
        <Scan size={24} />
        <span className="text-[10px] font-bold">Scan</span>
      </Link>

      {/* 2. Dashboard (Owner Only) */}
      {role === "owner" && (
        <Link
          href="/dashboard"
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive("/dashboard") ? "text-blue-600" : "text-slate-400"
          }`}
        >
          <LayoutDashboard size={24} />
          <span className="text-[10px] font-bold">Dash</span>
        </Link>
      )}

      {/* 3. Logs (Owner Only) */}
      {role === "owner" && (
        <Link
          href="/logs"
          className={`flex flex-col items-center gap-1 transition-colors ${
            isActive("/logs") ? "text-blue-600" : "text-slate-400"
          }`}
        >
          <ScrollText size={24} />
          <span className="text-[10px] font-bold">Logs</span>
        </Link>
      )}

      {/* 4. Menu / More (Placeholder for Settings/Logout on mobile) */}
      <Link
        href="/menu"
        className={`flex flex-col items-center gap-1 transition-colors ${
          isActive("/menu") ? "text-blue-600" : "text-slate-400"
        }`}
      >
        <Menu size={24} />
        <span className="text-[10px] font-bold">Menu</span>
      </Link>
    </nav>
  );
}
