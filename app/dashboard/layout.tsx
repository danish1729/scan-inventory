import { BottomNav } from "@/components/layout/BottomNav";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // double-check auth server-side
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
      {/* Main Content Area */}
      <div className="flex-1">{children}</div>

      {/* Fixed Bottom Navigation (Owner Mode) */}
      <BottomNav role="owner" />
    </div>
  );
}
