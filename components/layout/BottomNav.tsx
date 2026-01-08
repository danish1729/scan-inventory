"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ScanLine, Package, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav({ role }: { role: "owner" | "staff" }) {
  const pathname = usePathname();

  const ownerLinks = [
    { href: "/dashboard", label: "Home", icon: LayoutDashboard },
    { href: "/products/add", label: "Add", icon: Package },
    { href: "/staff", label: "Staff", icon: Users },
  ];

  const staffLinks = [{ href: "/scan", label: "Scan", icon: ScanLine }];

  const links = role === "owner" ? ownerLinks : staffLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1",
                isActive
                  ? "text-slate-900"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
