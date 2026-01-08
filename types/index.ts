export type Role = "owner" | "staff";

export interface Profile {
  id: string;
  store_id: string;
  full_name: string;
  role: Role;
}

export interface ProductLocation {
  id: string;
  product_id: string;
  name: string;
  type: "main" | "safety";
  quantity: number;
}

export interface Product {
  id: string;
  store_id: string;
  name: string;
  sku: string;
  unit_cost?: number;
  is_expensive?: boolean;
  qr_url: string | null;

  // Locations are now fetched via join, or calculated total
  locations?: ProductLocation[];
  total_stock?: number; // Helper for display
}
