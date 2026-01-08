export type Role = "owner" | "staff";

export interface Profile {
  id: string;
  store_id: string;
  full_name: string;
  role: Role;
}

export interface ProductLocation {
  name: string;
  type: "main" | "safety";
  quantity: number;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  sku: string;

  // Owner Only Fields
  unit_cost?: number;
  is_expensive?: boolean;
  qr_url: string | null;
  min_quantity: number; // For Low Stock Alerts

  // Data from Relations (Joined)
  locations?: ProductLocation[];

  // Calculated Fields (Not in DB, added by Server Page)
  total_stock?: number;
}
