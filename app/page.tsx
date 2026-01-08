import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function RootPage() {
  // 1. Initialize the client using YOUR helper
  const supabase = await createClient();

  // 2. Check if the user is logged in
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  // If no user, kick them to login
  if (authError || !user) {
    redirect("/login");
  }

  // 3. Fetch the user's Profile to check their Role
  // We use .maybeSingle() instead of .single() to avoid crashing if the profile is missing
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // 4. Role-Based Routing
  if (profile?.role === "staff") {
    redirect("/scan");
  } else {
    // Default to dashboard for Owners or if the profile is missing (first setup)
    redirect("/dashboard");
  }
}
