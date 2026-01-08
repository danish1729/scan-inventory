"use client";

import { useState } from "react";
import { Product } from "@/types";
import { Input } from "@/components/ui/Input";
import { Search, Lock, AlertTriangle, QrCode } from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import Image from "next/image";

interface ProductListProps {
  products: Product[];
  onProductClick?: (product: Product) => void;
  showQrAction?: boolean;
  onQrActionClick?: (product: Product) => void;
}

export function ProductList({
  products,
  onProductClick,
  showQrAction = false,
}: ProductListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "low" | "expensive">("all");
  const [qrModalProduct, setQrModalProduct] = useState<Product | null>(null);

  // Filter Logic
  const filteredProducts = products.filter((p) => {
    // 1. Search (Name or SKU)
    const matchesSearch =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.includes(query);
    if (!matchesSearch) return false;

    // 2. Filter Tabs
    if (filter === "low") {
      const mainQty =
        p.locations?.find((l) => l.type === "main")?.quantity || 0;
      return mainQty <= p.min_quantity; // Use dynamic threshold
    }
    if (filter === "expensive") return p.is_expensive;

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Bar */}
      <div className="sticky top-0 bg-slate-50 pt-2 pb-2 z-10 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <Input
            placeholder="Search products..."
            className="pl-10 bg-white"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {["all", "low", "expensive"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as "all" | "low" | "expensive")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-colors border ${
                filter === f
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-500 border-slate-200"
              }`}
            >
              {f === "low" ? "Low Stock" : f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3 pb-20">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm bg-white rounded-xl border border-dashed border-slate-200">
            No products found.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative active:scale-[0.99] transition-transform"
            >
              <Link href={`/products/${product.id}`} className="block">
                <div className="flex justify-between items-start mb-2 pr-8">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900">
                        {product.name}
                      </h3>
                      {product.is_expensive && (
                        <Lock size={12} className="text-amber-500" />
                      )}
                    </div>
                    <span className="text-xs text-slate-400 font-mono tracking-wide">
                      {product.sku}
                    </span>
                  </div>
                </div>

                <div className="flex items-end justify-between mt-2">
                  <div className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded">
                    {/* Show Main Location Name */}
                    loc:{" "}
                    <span className="font-semibold">
                      {product.locations?.find((l) => l.type === "main")?.name}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900 leading-none block">
                      {product.total_stock}
                    </span>

                    {/* Low Stock Warning */}
                    {(product.locations?.find((l) => l.type === "main")
                      ?.quantity || 0) <= product.min_quantity && (
                      <div className="flex items-center justify-end gap-1 text-[10px] font-bold text-red-500 mt-1">
                        <AlertTriangle size={10} /> LOW
                      </div>
                    )}
                  </div>
                </div>
              </Link>

              {/* Quick QR Button (Only if enabled) */}
              {showQrAction && (
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Don't trigger the Link
                    setQrModalProduct(product);
                  }}
                  className="absolute top-4 right-4 p-2 text-slate-300 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-colors"
                >
                  <QrCode size={20} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Mini QR Modal for Quick View */}
      {qrModalProduct && (
        <Modal
          isOpen={!!qrModalProduct}
          onClose={() => setQrModalProduct(null)}
          title="Product QR"
        >
          <div className="flex flex-col items-center p-6">
            <div className="bg-white p-2 border-2 border-slate-900 rounded-lg mb-4">
              {qrModalProduct.qr_url ? (
                <Image
                  src={qrModalProduct.qr_url}
                  width={200}
                  height={200}
                  alt="QR"
                  className="mix-blend-multiply"
                />
              ) : (
                <p>No QR</p>
              )}
            </div>
            <p className="font-mono text-xl font-bold">{qrModalProduct.sku}</p>
          </div>
        </Modal>
      )}
    </div>
  );
}
