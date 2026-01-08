"use client";

import { Product } from "@/types";
import { ProductList } from "@/components/shared/ProductList";
import { Package, AlertTriangle, DollarSign } from "lucide-react";

interface DashboardViewProps {
  initialProducts: Product[];
}

export function DashboardView({ initialProducts }: DashboardViewProps) {
  // 1. Calculate Top Stats
  const totalProducts = initialProducts.length;

  const lowStockCount = initialProducts.filter((p) => {
    // Check Main Location vs Min Quantity
    const mainLoc = p.locations?.find((l) => l.type === "main");
    return (mainLoc?.quantity || 0) <= p.min_quantity;
  }).length;

  const totalValue = initialProducts.reduce((sum, p) => {
    // Total Stock * Unit Cost
    return sum + (p.total_stock || 0) * (p.unit_cost || 0);
  }, 0);

  return (
    <div className="bg-slate-50 min-h-screen pb-10">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-10 md:static">
        <h1 className="text-2xl font-bold text-slate-900">Store Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of your inventory</p>
      </div>

      <div className="p-6 space-y-6">
        {/* STATS CARDS */}
        <div className="grid grid-cols-3 gap-4">
          {/* Card 1: Total Items */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <Package size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Products
              </span>
            </div>
            <p className="text-2xl font-black text-slate-900">
              {totalProducts}/5
            </p>
          </div>

          {/* Card 2: Low Stock */}
          <div
            className={`p-4 rounded-xl border shadow-sm ${
              lowStockCount > 0
                ? "bg-red-50 border-red-100"
                : "bg-white border-slate-200"
            }`}
          >
            <div
              className={`flex items-center gap-2 mb-2 ${
                lowStockCount > 0 ? "text-red-500" : "text-slate-400"
              }`}
            >
              <AlertTriangle size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Alerts
              </span>
            </div>
            <p
              className={`text-2xl font-black ${
                lowStockCount > 0 ? "text-red-600" : "text-slate-900"
              }`}
            >
              {lowStockCount}
            </p>
          </div>

          {/* Card 3: Value (Owner Only) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 mb-2">
              <DollarSign size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Value
              </span>
            </div>
            <p className="text-xl font-black text-slate-900 truncate">
              ${totalValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* PRODUCT LIST */}
        <div>
          <h2 className="font-bold text-slate-900 mb-3 text-lg">Inventory</h2>
          <ProductList products={initialProducts} showQrAction={true} />
        </div>
      </div>
    </div>
  );
}
