import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogsView } from "@/components/logs/LogsView";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const supabase = await createClient();

  // 1. Get User
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Verify Role (Strict Owner Check)
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "owner") {
    redirect("/scan"); // Kick staff out to scanner
  }

  // 3. Fetch Logs (Updated for Snapshot Name Strategy)
  // We removed 'profiles ( full_name )' and now rely on the 'user_name' column in the log itself.
  const { data: logs, error } = await supabase
    .from("inventory_logs")
    .select(
      `
      *,
      products ( name, sku )
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Logs Error:", error);
    return (
      <div className="p-8 text-red-500 text-center">Failed to load logs.</div>
    );
  }

  return <LogsView logs={logs || []} />;
}
