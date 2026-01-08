import { createClient } from "@/lib/supabase/server";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { Product } from "@/types";

export const dynamic = "force-dynamic";

interface RawProduct {
  id: string;
  store_id: string;
  name: string;
  sku: string;
  unit_cost: number;
  is_expensive: boolean;
  qr_url: string | null;
  min_quantity: number;
  locations: {
    id: string;
    name: string;
    type: "main" | "safety";
    quantity: number;
  }[];
  created_at: string;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Fetch Data (User check handled by Layout)
  const { data: rawData, error } = await supabase
    .from("products")
    .select(`*, locations:product_locations(id, name, type, quantity)`)
    .order("created_at", { ascending: false });

  if (error)
    return <div className="p-8 text-red-500">Failed to load inventory.</div>;

  // 2. Transform Data
  const products: Product[] = (rawData as unknown as RawProduct[]).map((p) => ({
    id: p.id,
    store_id: p.store_id,
    name: p.name,
    sku: p.sku,
    unit_cost: p.unit_cost,
    is_expensive: p.is_expensive,
    qr_url: p.qr_url,
    min_quantity: p.min_quantity,
    locations: p.locations,
    total_stock: p.locations.reduce((sum, loc) => sum + loc.quantity, 0),
  }));

  return <DashboardView initialProducts={products} />;
}
