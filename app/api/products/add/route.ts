import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const body = await request.json();

    // 1. Validation
    if (!/^\d{9}$/.test(body.sku))
      return NextResponse.json(
        { error: "SKU must be 9 digits." },
        { status: 400 }
      );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (profile.role !== "owner")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // 2. Check Limits
    const { count } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("store_id", profile.store_id);
    if (count !== null && count >= 5)
      return NextResponse.json(
        { error: "Limit reached (5 products)" },
        { status: 402 }
      );

    // 3. Insert Product (No quantity here anymore)
    const { data: product, error: prodError } = await supabase
      .from("products")
      .insert({
        store_id: profile.store_id,
        name: body.name,
        sku: body.sku,
        unit_cost: body.unit_cost,
        is_expensive: body.is_expensive,
        qr_url: body.qr_url,
      })
      .select()
      .single();

    if (prodError) throw prodError;

    // 4. Insert LOCATIONS (The new step)
    const { error: locError } = await supabase
      .from("product_locations")
      .insert([
        {
          store_id: profile.store_id,
          product_id: product.id,
          name: body.main_location, // e.g., "Shelf A"
          type: "main",
          quantity: body.main_qty,
        },
        {
          store_id: profile.store_id,
          product_id: product.id,
          name: body.safety_location, // e.g., "Back Room"
          type: "safety",
          quantity: body.safety_qty,
        },
      ]);

    if (locError) throw locError;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
