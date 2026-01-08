"use client";

import { useState } from "react";
import { Product } from "@/types";
import { Input } from "@/components/ui/Input";
import {
  Search,
  Lock,
  AlertTriangle,
  ChevronRight,
  QrCode,
} from "lucide-react";
import Link from "next/link";

interface ProductListProps {
  products: Product[];
  onProductClick?: (product: Product) => void; // Optional: Override click behavior
  showQrAction?: boolean; // Optional: Show the mini QR button
  onQrActionClick?: (product: Product) => void;
}

export function ProductList({
  products,
  onProductClick,
  showQrAction,
  onQrActionClick,
}: ProductListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "expensive">("all");

  // Filter Logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.includes(query);

    if (!matchesSearch) return false;
    if (filter === "low") return p.main_qty <= p.safety_qty;
    if (filter === "expensive") return p.is_expensive;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="space-y-3 sticky top-0 bg-slate-50 z-10 py-2">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <Input
            placeholder="Search name or SKU..."
            className="pl-10"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {["all", "low", "expensive"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as "all" | "low" | "expensive")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap border transition-colors ${
                filter === f
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              {f === "low" ? "Low Stock" : f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            No products match.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => (onProductClick ? onProductClick(product) : null)}
              className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative group ${
                onProductClick ? "cursor-pointer active:bg-slate-50" : ""
              }`}
            >
              {/* If no custom click handler, wrap in Link. Otherwise, just a div */}
              {onProductClick ? (
                <Content product={product} />
              ) : (
                <Link href={`/products/${product.id}`}>
                  <Content product={product} />
                </Link>
              )}

              {/* Optional Mini QR Action Button */}
              {showQrAction && onQrActionClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onQrActionClick(product);
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-colors"
                >
                  <QrCode size={20} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Helper Sub-component for clean code
function Content({ product }: { product: Product }) {
  return (
    <>
      <div className="flex justify-between items-start mb-2 pr-8">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="font-bold text-slate-900">{product.name}</h3>
            {product.is_expensive && (
              <Lock size={12} className="text-amber-500" />
            )}
          </div>
          <span className="text-xs text-slate-400 font-mono">
            SKU: {product.sku}
          </span>
        </div>
      </div>

      <div className="flex items-end justify-between mt-2">
        <div className="text-xs text-slate-500">
          <span className="block">{product.main_location}</span>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-slate-900 leading-none">
            {product.total_stock}
          </span>
          {product.main_qty <= product.safety_qty && (
            <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-red-500 mt-1">
              <AlertTriangle size={10} />
              LOW
            </div>
          )}
        </div>
      </div>
    </>
  );
}
