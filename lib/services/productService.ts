import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export const getProductWithLocations = cache(async (productId: string) => {
  const supabase = await createClient();

  console.log(`🔍 Fetching Product ID: ${productId}`);

  // 1. Check Auth (To ensure RLS allows access)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    console.error("❌ No User Logged In");
    return null;
  }

  // 2. Fetch Product
  const { data: product, error: prodError } = await supabase
    .from("products")
    .select("*")
    .eq("id", productId)
    .single();

  if (prodError) {
    console.error("❌ Product Fetch Error:", prodError.message);
    return null;
  }

  if (!product) {
    console.error("❌ Product returned null (Likely RLS issue or ID mismatch)");
    return null;
  }

  console.log(`✅ Found Product: ${product.name}`);

  // 3. Fetch Locations
  const { data: locations, error: locError } = await supabase
    .from("product_locations")
    .select("*")
    .eq("product_id", productId);

  if (locError) {
    console.error("❌ Location Fetch Error:", locError.message);
    // We don't return null here, we just return empty locations to avoid 404 on valid product
  }

  // 4. Merge
  return {
    ...product,
    locations: locations || [],
  };
});
