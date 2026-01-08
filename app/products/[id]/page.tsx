"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Product, Profile } from "@/types";
import {
  Loader2,
  Minus,
  Plus,
  AlertTriangle,
  Lock,
  MapPin,
  History,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [product, setProduct] = useState<Product | null>(null);
  const [userRole, setUserRole] = useState<"owner" | "staff" | null>(null);
  const [loading, setLoading] = useState(true);

  // Adjustment State
  const [adjustMode, setAdjustMode] = useState<"+" | "-" | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false); // For Expensive items

  // Fetch Data
  useEffect(() => {
    const loadData = async () => {
      // 1. Get User Role
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setUserRole(profile?.role || "staff");

      // 2. Get Product
      const { data: prod, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !prod) {
        alert("Product not found or access denied");
        router.push(profile?.role === "staff" ? "/scan" : "/dashboard");
        return;
      }
      setProduct(prod);
      setLoading(false);
    };

    loadData();
  }, [id, router, supabase]);

  // Handle Inventory Update
  const handleAdjustment = async () => {
    if (!product || !adjustMode) return;

    // Safety Check for Expensive Items (Only on subtract)
    if (adjustMode === "-" && product.is_expensive && !showConfirm) {
      setShowConfirm(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          type: adjustMode,
          quantity: quantity,
          reason: reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Success UI Update
      setProduct((prev) =>
        prev ? { ...prev, total_stock: data.newStock } : null
      );
      setAdjustMode(null);
      setQuantity(1);
      setReason("");
      setShowConfirm(false);
      alert("Stock updated successfully");
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!product) return null;

  return (
    <div className="bg-slate-50 min-h-screen pb-safe">
      <Header title="Product Details" showBack />

      <main className="p-4 space-y-6">
        {/* 1. Main Info Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                {product.name}
              </h1>
              <p className="text-slate-400 font-mono text-sm mt-1">
                SKU: {product.sku}
              </p>
            </div>
            {/* Only Owner sees Cost */}
            {userRole === "owner" && (
              <div className="text-right">
                <span className="block text-xs text-slate-400 uppercase font-bold">
                  Cost
                </span>
                <span className="text-lg font-bold text-slate-700">
                  {formatCurrency(product.unit_cost)}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div>
              <span className="text-xs text-slate-400 font-bold uppercase block mb-1">
                Total Stock
              </span>
              <span className="text-4xl font-black text-slate-900 leading-none">
                {product.total_stock}
              </span>
            </div>
            {product.is_expensive && userRole === "owner" && (
              <div className="flex items-center gap-1 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg text-xs font-bold">
                <Lock size={12} /> High Value
              </div>
            )}
          </div>
        </div>

        {/* 2. Locations */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2 mb-2 text-slate-400">
              <MapPin size={16} />
              <span className="text-xs font-bold uppercase">Main</span>
            </div>
            <p className="font-semibold text-slate-800">
              {product.main_location}
            </p>
            <p className="text-sm text-slate-500">{product.main_qty} units</p>
          </div>

          <div
            className={`p-3 rounded-xl border ${
              product.total_stock <= product.safety_qty
                ? "bg-red-50 border-red-100"
                : "bg-white border-slate-100"
            }`}
          >
            <div className="flex items-center gap-2 mb-2 text-slate-400">
              <AlertTriangle
                size={16}
                className={
                  product.total_stock <= product.safety_qty
                    ? "text-red-500"
                    : ""
                }
              />
              <span
                className={`text-xs font-bold uppercase ${
                  product.total_stock <= product.safety_qty
                    ? "text-red-500"
                    : ""
                }`}
              >
                Safety
              </span>
            </div>
            <p className="font-semibold text-slate-800">
              {product.safety_location}
            </p>
            <p className="text-sm text-slate-500">
              Alert at: {product.safety_qty}
            </p>
          </div>
        </div>

        {/* 3. Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setAdjustMode("-")}
            className="flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-100 rounded-2xl active:scale-95 transition-all hover:border-red-100 hover:bg-red-50"
          >
            <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-2">
              <Minus size={24} />
            </div>
            <span className="font-bold text-slate-700">Stock Out</span>
          </button>

          <button
            onClick={() => setAdjustMode("+")}
            className="flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-100 rounded-2xl active:scale-95 transition-all hover:border-green-100 hover:bg-green-50"
          >
            <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
              <Plus size={24} />
            </div>
            <span className="font-bold text-slate-700">Stock In</span>
          </button>
        </div>

        {/* 4. Owner History Link (Optional V1 Feature) */}
        {userRole === "owner" && (
          <div className="bg-slate-100 rounded-xl p-4 flex items-center justify-between text-slate-500 text-sm">
            <div className="flex items-center gap-2">
              <History size={16} />
              <span>Recent Activity</span>
            </div>
            <span>View Logs →</span>
          </div>
        )}
      </main>

      {/* ADJUSTMENT MODAL (Built-in) */}
      <Modal
        isOpen={!!adjustMode}
        onClose={() => setAdjustMode(null)}
        title={adjustMode === "+" ? "Add Stock" : "Remove Stock"}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center py-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-3 bg-slate-100 rounded-full"
            >
              <Minus />
            </button>
            <span className="text-4xl font-bold w-24 text-center">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="p-3 bg-slate-100 rounded-full"
            >
              <Plus />
            </button>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
              Reason
            </label>
            <select
              className="w-full p-3 bg-slate-50 rounded-lg border border-slate-200"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="">Select a reason...</option>
              {adjustMode === "+" ? (
                <>
                  <option value="Restock">New Shipment</option>
                  <option value="Return">Customer Return</option>
                  <option value="Found">Inventory Correction (Found)</option>
                </>
              ) : (
                <>
                  <option value="Sale">Sold</option>
                  <option value="Damaged">Damaged / Expired</option>
                  <option value="Lost">Inventory Correction (Lost)</option>
                </>
              )}
            </select>
          </div>

          <Button
            onClick={handleAdjustment}
            isLoading={isSubmitting}
            disabled={!reason}
            variant={adjustMode === "+" ? "primary" : "danger"}
          >
            Confirm {adjustMode === "+" ? "Add" : "Remove"}
          </Button>
        </div>
      </Modal>

      {/* EXPENSIVE ITEM CONFIRMATION */}
      <Modal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        title="High Value Item"
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
            <Lock size={24} />
          </div>
          <p className="text-slate-600">
            This is an <strong>expensive product</strong>. Are you sure you want
            to remove <strong>{quantity}</strong> units?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleAdjustment}>
              Yes, Confirm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
