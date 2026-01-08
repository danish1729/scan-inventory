import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic"; // Ensure we don't cache stale inventory data

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // 2. Fetch products for this store
  // We join profiles to ensure store isolation, though RLS handles this securely too.
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if(products === null) {
    return <div className="p-4 text-red-500 w-full text-center justify-center align-center">No products found.</div>;
  }

  if (error) {
    console.error("Error fetching products", error);
    return <div className="p-4 text-red-500">Failed to load inventory.</div>;
  }

  // 3. Render Client View
  return <DashboardView initialProducts={products || []} />;
}
