"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Role } from "@/types";
import {
  LayoutDashboard,
  Scan,
  ScrollText,
  Users,
  Package,
  LogOut,
  Store,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  const linkClass = (path: string) => `
    flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
    ${
      isActive(path)
        ? "bg-slate-900 text-white shadow-md"
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
    }
  `;

  return (
    <aside className="w-64 h-screen bg-white border-r border-slate-200 fixed left-0 top-0 hidden md:flex flex-col z-50">
      {/* Brand */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-900">
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
            <Store size={18} />
          </div>
          <span className="font-bold text-lg tracking-tight">StoreAdmin</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {/* Owner & Staff Links */}
        <Link href="/scan" className={linkClass("/scan")}>
          <Scan size={20} /> Scanner
        </Link>

        {role === "owner" && (
          <>
            <div className="pt-4 pb-2 px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
              Management
            </div>
            <Link href="/dashboard" className={linkClass("/dashboard")}>
              <LayoutDashboard size={20} /> Dashboard
            </Link>
            <Link href="/products/add" className={linkClass("/products/add")}>
              <Package size={20} /> Add Product
            </Link>
            <Link href="/logs" className={linkClass("/logs")}>
              <ScrollText size={20} /> History Logs
            </Link>
            <Link href="/staff" className={linkClass("/staff")}>
              <Users size={20} /> Staff Access
            </Link>
          </>
        )}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors text-sm font-medium"
        >
          <LogOut size={20} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
