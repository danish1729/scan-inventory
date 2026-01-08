import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  try {
    const { productId, action, quantity, reason, locationType, moveFromType } =
      await request.json();
    const qty = parseInt(quantity);

    // 1. Basic Validation
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json(
        { error: "Quantity must be a positive number" },
        { status: 400 }
      );
    }

    // 2. Get the User (Staff or Owner)
    // 2. Get the User (Staff or Owner)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch the name of the person doing the action right now
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const actorName = profile?.full_name || "Unknown Staff";

    // 3. Fetch Product Locations to verify stock
    const { data: locations, error: locError } = await supabase
      .from("product_locations")
      .select("*")
      .eq("product_id", productId);

    if (locError || !locations) throw new Error("Product locations not found");

    const mainLoc = locations.find((l) => l.type === "main");
    const safetyLoc = locations.find((l) => l.type === "safety");

    if (!mainLoc || !safetyLoc)
      throw new Error("Database Error: Missing location rows");

    // Prepare Log Data
    const logData = {
      action_type: action,
      quantity: qty,
      reason: reason,
      location_from: null as string | null,
      location_to: null as string | null,
    };

    // 4. EXECUTE THE LOGIC
    if (action === "stock_in") {
      // Logic: Add to selected location
      const target = locationType === "main" ? mainLoc : safetyLoc;

      const { error } = await supabase
        .from("product_locations")
        .update({ quantity: target.quantity + qty })
        .eq("id", target.id);

      if (error) throw error;

      // Log details
      logData.location_to = target.name;
    } else if (action === "stock_out") {
      // Logic: Subtract from selected location
      const target = locationType === "main" ? mainLoc : safetyLoc;

      if (target.quantity < qty) {
        return NextResponse.json(
          {
            error: `Not enough stock in ${target.name}. Current: ${target.quantity}`,
          },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from("product_locations")
        .update({ quantity: target.quantity - qty })
        .eq("id", target.id);

      if (error) throw error;

      // Log details
      logData.location_from = target.name;
    } else if (action === "move") {
      // Logic: Move FROM source TO dest
      const source = moveFromType === "main" ? mainLoc : safetyLoc;
      const dest = moveFromType === "main" ? safetyLoc : mainLoc; // The opposite

      if (source.quantity < qty) {
        return NextResponse.json(
          {
            error: `Cannot move ${qty}. Only ${source.quantity} in ${source.name}.`,
          },
          { status: 400 }
        );
      }

      // 4a. Subtract from Source
      const { error: subError } = await supabase
        .from("product_locations")
        .update({ quantity: source.quantity - qty })
        .eq("id", source.id);
      if (subError) throw subError;

      // 4b. Add to Dest
      const { error: addError } = await supabase
        .from("product_locations")
        .update({ quantity: dest.quantity + qty })
        .eq("id", dest.id);
      if (addError) throw addError;

      // Log details
      logData.location_from = source.name;
      logData.location_to = dest.name;
    }

    // 5. SAVE THE LOG (Critical Step)
    // This inserts a row that the Owner sees in /logs
    const { data: product } = await supabase
      .from("products")
      .select("store_id")
      .eq("id", productId)
      .single();

    await supabase.from("inventory_logs").insert({
      store_id: product?.store_id,
      product_id: productId,
      user_id: user.id,
      user_name: actorName, // <--- ADD THIS LINE (Snapshots the name)
      ...logData,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Inventory Action Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Server Error" },
      { status: 500 }
    );
  }
}
