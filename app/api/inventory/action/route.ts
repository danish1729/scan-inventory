import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { productId, action, quantity, locationType, moveFromType, reason } =
      await request.json();
    const qty = parseInt(quantity);
    if (qty <= 0) throw new Error("Quantity must be positive");

    // 1. Fetch the relevant locations for this product
    const { data: locations, error: locError } = await supabase
      .from("product_locations")
      .select("*")
      .eq("product_id", productId);

    if (locError || !locations) throw new Error("Locations not found");

    const mainLoc = locations.find((l) => l.type === "main");
    const safetyLoc = locations.find((l) => l.type === "safety");

    if (!mainLoc || !safetyLoc) throw new Error("Product locations corrupted");

    let logData = {
      action_type: action,
      quantity: qty,
      location_from: null as string | null,
      location_to: null as string | null,
      reason: reason,
    };

    // 2. Perform Updates
    if (action === "stock_in") {
      // Add to specific location
      const target = locationType === "main" ? mainLoc : safetyLoc;

      const { error } = await supabase
        .from("product_locations")
        .update({ quantity: target.quantity + qty })
        .eq("id", target.id);

      if (error) throw error;
    } else if (action === "stock_out") {
      // Remove from specific location
      const target = locationType === "main" ? mainLoc : safetyLoc;

      if (target.quantity < qty)
        throw new Error(`Not enough stock in ${target.name}`);

      const { error } = await supabase
        .from("product_locations")
        .update({ quantity: target.quantity - qty })
        .eq("id", target.id);

      if (error) throw error;
    } else if (action === "move") {
      // Move between locations
      const source = moveFromType === "main" ? mainLoc : safetyLoc;
      const dest = moveFromType === "main" ? safetyLoc : mainLoc;

      if (source.quantity < qty)
        throw new Error(`Not enough stock in ${source.name} to move`);

      // Transaction-like update (Sequentially)
      const { error: error1 } = await supabase
        .from("product_locations")
        .update({ quantity: source.quantity - qty })
        .eq("id", source.id);

      if (error1) throw error1;

      const { error: error2 } = await supabase
        .from("product_locations")
        .update({ quantity: dest.quantity + qty })
        .eq("id", dest.id);

      if (error2) throw error2;

      logData.location_from = source.name;
      logData.location_to = dest.name;
    }

    // 3. Log It
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: product } = await supabase
      .from("products")
      .select("store_id")
      .eq("id", productId)
      .single();

    await supabase.from("inventory_logs").insert({
      store_id: product?.store_id,
      product_id: productId,
      user_id: user?.id,
      ...logData,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
