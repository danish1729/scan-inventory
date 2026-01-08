"use client";

import { useState } from "react";
import { Product, Role } from "@/types";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useInventoryAction } from "@/hooks/useInventoryAction";
import {
  MapPin,
  ArrowRightLeft,
  Plus,
  Minus,
  Lock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface Props {
  product: Product;
  role: Role;
}

export function ProductDetailView({ product, role }: Props) {
  const { executeAction, loading } = useInventoryAction();

  // Modal State
  const [modalType, setModalType] = useState<"in" | "out" | "move" | null>(
    null
  );

  // Form State
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("Restock");
  const [targetType, setTargetType] = useState<"main" | "safety">("main"); // Where to Add/Remove
  const [moveFromType, setMoveFromType] = useState<"main" | "safety">("main"); // Where to Move FROM

  // Derived Data
  const mainLoc = product.locations?.find((l) => l.type === "main");
  const safetyLoc = product.locations?.find((l) => l.type === "safety");

  // Safe Fallback for display
  const mainQty = mainLoc?.quantity || 0;
  const safetyQty = safetyLoc?.quantity || 0;
  const totalStock = mainQty + safetyQty;

  const handleConfirm = async () => {
    // Only Owners see the "Expensive Item" warning
    if (role === "owner" && product.is_expensive && modalType === "out") {
      if (!confirm("⚠️ High Value Item Warning: Confirm removal?")) return;
    }

    const result = await executeAction({
      productId: product.id,
      action:
        modalType === "in"
          ? "stock_in"
          : modalType === "out"
          ? "stock_out"
          : "move",
      quantity: qty,
      reason,
      locationType: targetType,
      moveFromType: moveFromType,
    });

    if (result.success) {
      setModalType(null);
      setQty(1);
    }
  };

  if (!mainLoc || !safetyLoc)
    return <div className="p-8 text-center">Loading Locations...</div>;

  return (
    <div className="bg-slate-50 min-h-screen">
      <Header title="Product Action" showBack />

      <div className="p-4 space-y-4">
        {/* 1. PRODUCT INFO CARD */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">
                {product.name}
              </h1>
              <p className="font-mono text-sm text-slate-400 mt-1">
                {product.sku}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                Total Stock
              </span>
              <span className="text-3xl font-black text-slate-900 leading-none">
                {totalStock}
              </span>
            </div>
          </div>

          {/* Owner Only: Expensive Badge */}
          {role === "owner" && product.is_expensive && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg text-xs font-bold border border-amber-100">
              <Lock size={12} /> High Value Item
            </div>
          )}
        </div>

        {/* 2. LOCATIONS GRID */}

        <div className="grid grid-cols-2 gap-3">
          {/* Main Location */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500" />
            <div className="flex items-center gap-2 mb-2 text-blue-600">
              <MapPin size={16} />{" "}
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Main
              </span>
            </div>
            <p className="text-sm font-bold text-slate-700 truncate mb-1">
              {mainLoc.name}
            </p>
            <p className="text-2xl font-black text-slate-900">{mainQty}</p>
          </div>

          {/* Safety Location */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500" />
            <div className="flex items-center gap-2 mb-2 text-amber-600">
              <AlertTriangle size={16} />{" "}
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Safety
              </span>
            </div>
            <p className="text-sm font-bold text-slate-700 truncate mb-1">
              {safetyLoc.name}
            </p>
            <p className="text-2xl font-black text-slate-900">{safetyQty}</p>
          </div>
        </div>

        {/* 3. ACTION BUTTONS */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <button
            onClick={() => setModalType("in")}
            className="bg-white border-2 border-transparent shadow-sm hover:border-green-100 active:scale-95 transition-all p-3 rounded-xl flex flex-col items-center gap-2 text-slate-600"
          >
            <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
              <Plus size={24} />
            </div>
            <span className="text-xs font-bold">Add</span>
          </button>

          <button
            onClick={() => setModalType("out")}
            className="bg-white border-2 border-transparent shadow-sm hover:border-red-100 active:scale-95 transition-all p-3 rounded-xl flex flex-col items-center gap-2 text-slate-600"
          >
            <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center">
              <Minus size={24} />
            </div>
            <span className="text-xs font-bold">Remove</span>
          </button>

          <button
            onClick={() => setModalType("move")}
            className="bg-white border-2 border-transparent shadow-sm hover:border-blue-100 active:scale-95 transition-all p-3 rounded-xl flex flex-col items-center gap-2 text-slate-600"
          >
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowRightLeft size={20} />
            </div>
            <span className="text-xs font-bold">Move</span>
          </button>
        </div>
      </div>

      {/* 4. INTERACTION MODAL */}
      <Modal
        isOpen={!!modalType}
        onClose={() => setModalType(null)}
        title={
          modalType === "in"
            ? "Stock In (+)"
            : modalType === "out"
            ? "Stock Out (-)"
            : "Move Stock"
        }
      >
        <div className="space-y-6 pt-2">
          {/* Quantity Spinner */}
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => setQty(Math.max(1, qty - 1))}
              className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold active:bg-slate-200 transition"
            >
              -
            </button>
            <span className="text-4xl font-black w-20 text-center text-slate-900">
              {qty}
            </span>
            <button
              onClick={() => setQty(qty + 1)}
              className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl font-bold active:bg-slate-200 transition"
            >
              +
            </button>
          </div>

          {/* DYNAMIC FORM: Changes based on Action Type */}
          {modalType === "move" ? (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-400 uppercase mb-3 text-center">
                Move Direction
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setMoveFromType("main")}
                  className={`flex-1 py-3 px-2 text-xs font-bold rounded-lg border-2 transition-all flex items-center justify-center gap-1 ${
                    moveFromType === "main"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-transparent bg-white text-slate-500"
                  }`}
                >
                  Main <ArrowRight size={12} /> Safety
                </button>
                <button
                  onClick={() => setMoveFromType("safety")}
                  className={`flex-1 py-3 px-2 text-xs font-bold rounded-lg border-2 transition-all flex items-center justify-center gap-1 ${
                    moveFromType === "safety"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-transparent bg-white text-slate-500"
                  }`}
                >
                  Safety <ArrowRight size={12} /> Main
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-400 ml-1">
                Location
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTargetType("main")}
                  className={`py-3 text-sm font-bold rounded-xl border-2 transition-all ${
                    targetType === "main"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-100 text-slate-500"
                  }`}
                >
                  Main ({mainLoc.name})
                </button>
                <button
                  onClick={() => setTargetType("safety")}
                  className={`py-3 text-sm font-bold rounded-xl border-2 transition-all ${
                    targetType === "safety"
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-100 text-slate-500"
                  }`}
                >
                  Safety ({safetyLoc.name})
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-slate-400 ml-1">
              Reason
            </label>
            <select
              className="w-full p-3 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:ring-2 focus:ring-slate-900 outline-none"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="Restock">Restock / Shipment</option>
              <option value="Sale">Sale / Usage</option>
              <option value="Damage">Damaged / Expired</option>
              <option value="Return">Customer Return</option>
              <option value="Correction">Inventory Count Correction</option>
            </select>
          </div>

          <Button
            onClick={handleConfirm}
            isLoading={loading}
            className="w-full py-4 text-base shadow-lg shadow-slate-200"
          >
            Confirm Action
          </Button>
        </div>
      </Modal>
    </div>
  );
}
