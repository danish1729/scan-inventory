import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { productId, type, quantity, reason } = await request.json();
    const qtyNumber = parseInt(quantity);

    if (isNaN(qtyNumber) || qtyNumber <= 0) {
      return NextResponse.json({ error: "Invalid quantity" }, { status: 400 });
    }

    // 1. Fetch current product to check stock levels
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("total_stock, store_id")
      .eq("id", productId)
      .single();

    if (fetchError || !product) throw new Error("Product not found");

    // 2. Calculate New Stock
    const newStock =
      type === "+"
        ? product.total_stock + qtyNumber
        : product.total_stock - qtyNumber;

    if (newStock < 0) {
      return NextResponse.json(
        { error: "Cannot reduce stock below zero." },
        { status: 400 }
      );
    }

    // 3. Get Current User ID for the Log
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 4. Update Product Stock
    const { error: updateError } = await supabase
      .from("products")
      .update({ total_stock: newStock })
      .eq("id", productId);

    if (updateError) throw updateError;

    // 5. Create Inventory Log
    const { error: logError } = await supabase.from("inventory_logs").insert({
      store_id: product.store_id,
      product_id: productId,
      user_id: user.id, // Log who did it
      action_type: type,
      quantity: qtyNumber,
      reason: reason || "Manual Adjustment",
    });

    if (logError) throw logError;

    return NextResponse.json({ success: true, newStock });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
