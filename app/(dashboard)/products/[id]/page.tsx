import { getProductWithLocations } from "@/lib/services/productService";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ProductDetailView } from "@/components/products/ProductsDetailView";

// 1. Update the Props Type to expect a Promise
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // 2. AWAIT the params to get the ID
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // 3. Use the ID (which is now a valid string)
  const product = await getProductWithLocations(id);

  if (!product) notFound();

  // Sanitize for staff
  if (profile?.role === "staff") {
    delete product.unit_cost;
    delete product.is_expensive;
  }

  return (
    <ProductDetailView product={product} role={profile?.role || "staff"} />
  );
}
