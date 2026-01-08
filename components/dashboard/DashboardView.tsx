"use client";

import { useState } from "react";
import { Product } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { AlertTriangle, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { ProductList } from "@/components/shared/ProductList";

interface DashboardViewProps {
  initialProducts: Product[];
}

export function DashboardView({ initialProducts }: DashboardViewProps) {
  const [selectedQrProduct, setSelectedQrProduct] = useState<Product | null>(
    null
  );

  // Stats Logic
  const lowStockCount = initialProducts.filter(
    (p) => p.main_qty <= p.safety_qty
  ).length;
  const totalValue = initialProducts.reduce(
    (sum, p) => sum + p.total_stock * p.unit_cost,
    0
  );

  return (
    <div className="p-4 space-y-6 pb-24">
      {/* Header & Stats (Kept same as before) */}
      <header className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 text-sm">
              {initialProducts.length} Products Total
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400 uppercase font-bold tracking-wider">
              Total Value
            </p>
            <p className="text-lg font-bold text-slate-900">
              {formatCurrency(totalValue)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div
            className={`p-3 rounded-xl border ${
              lowStockCount > 0
                ? "bg-red-50 border-red-100"
                : "bg-white border-slate-100"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle
                size={16}
                className={
                  lowStockCount > 0 ? "text-red-500" : "text-slate-400"
                }
              />
              <span
                className={`text-xs font-bold ${
                  lowStockCount > 0 ? "text-red-700" : "text-slate-500"
                }`}
              >
                Low Stock
              </span>
            </div>
            <span className="text-2xl font-bold text-slate-900">
              {lowStockCount}
            </span>
          </div>

          <Link
            href="/products/add"
            className="p-3 rounded-xl bg-slate-900 text-white flex flex-col justify-center items-center active:scale-95 transition-transform"
          >
            <Plus size={24} className="mb-1" />
            <span className="text-xs font-bold">Add Product</span>
          </Link>
        </div>
      </header>

      {/* REUSABLE PRODUCT LIST */}
      <ProductList
        products={initialProducts}
        showQrAction={true}
        onQrActionClick={(product) => setSelectedQrProduct(product)}
      />

      {/* QR MODAL (Same as before) */}
      <Modal
        isOpen={!!selectedQrProduct}
        onClose={() => setSelectedQrProduct(null)}
        title={selectedQrProduct?.name || "Product QR"}
      >
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          <div className="bg-white p-4 rounded-xl border-2 border-slate-900 shadow-lg">
            {selectedQrProduct?.qr_url ? (
              <Image
                src={selectedQrProduct.qr_url}
                alt={selectedQrProduct.name}
                width={250}
                height={250}
                className="mix-blend-multiply"
              />
            ) : (
              <div className="w-[250px] h-[250px] flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
                QR Not Found
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="font-mono text-xl font-bold tracking-widest text-slate-900">
              {selectedQrProduct?.sku}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
