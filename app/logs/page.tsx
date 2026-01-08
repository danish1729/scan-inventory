import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogsView } from "@/components/logs/LogsView";

export const dynamic = "force-dynamic"; // Always fetch fresh logs

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
    redirect("/dashboard"); // Kick staff out
  }

  // 3. Fetch Logs (with Relations)
  // We join 'products' to get the SKU/Name and 'profiles' to get the Staff Name
  const { data: logs, error } = await supabase
    .from("inventory_logs")
    .select(
      `
      *,
      products ( name, sku ),
      profiles ( full_name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(100); // Limit to last 100 actions for performance

  if (error) {
    console.error("Logs Error:", error);
    return (
      <div className="p-8 text-red-500 text-center">Failed to load logs.</div>
    );
  }

  return <LogsView logs={logs || []} />;
}
