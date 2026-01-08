"use client";
import { useRouter } from "next/navigation";
import { ChevronLeft, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showLogout?: boolean;
}

export function Header({ title, showBack, showLogout }: HeaderProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 active:bg-slate-200"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        <h1 className="text-lg font-bold text-slate-900">{title}</h1>
      </div>

      {showLogout && (
        <button
          onClick={handleLogout}
          className="p-2 -mr-2 text-slate-500 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <LogOut size={20} />
        </button>
      )}
    </header>
  );
}
