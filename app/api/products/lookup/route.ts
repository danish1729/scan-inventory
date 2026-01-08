import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { sku } = await request.json();

    // 1. Search for product by SKU
    // Note: We use .maybeSingle() because duplicates *shouldn't* exist but might in dev
    const { data: product, error } = await supabase
      .from("products")
      .select("id, store_id")
      .eq("sku", sku)
      .maybeSingle();

    if (error) throw error;

    if (!product) {
      return NextResponse.json({ found: false }, { status: 404 });
    }

    // 2. Check if user has access to this store
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("store_id")
      .eq("id", user?.id)
      .single();

    if (userProfile?.store_id !== product.store_id) {
      return NextResponse.json(
        { error: "Product belongs to another store" },
        { status: 403 }
      );
    }

    return NextResponse.json({ found: true, id: product.id });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
