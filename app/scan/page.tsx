"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { QRScanner } from "@/components/features/QrScanner";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { ProductList } from "@/components/shared/ProductList"; // New Import
import { Modal } from "@/components/ui/Modal";
import { QrCode, Camera, Loader2 } from "lucide-react";
import { Product } from "@/types";
import Image from "next/image";

export default function ScanPage() {
  const router = useRouter();
  const supabase = createClient();

  // Set default to 'generate' (Test QR) as requested
  const [activeTab, setActiveTab] = useState<"scan" | "generate">("generate");

  // State for Product List
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // State for Selected QR
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch Products on Mount (Only needed for Generate Tab)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      // We can fetch from client because RLS protects the data anyway
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch user's store ID first (safe approach)
      const { data: profile } = await supabase
        .from("profiles")
        .select("store_id")
        .eq("id", user.id)
        .single();

      if (profile) {
        const { data } = await supabase
          .from("products")
          .select("*")
          .eq("store_id", profile.store_id)
          .order("name");
        if (data) setProducts(data);
      }
      setLoadingProducts(false);
    };

    fetchProducts();
  }, []);

  const handleScan = async (scannedSku: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch("/api/products/lookup", {
        method: "POST",
        body: JSON.stringify({ sku: scannedSku }),
      });
      const data = await res.json();

      if (!res.ok || !data.found) {
        alert("Product not found! Check the SKU.");
        window.location.reload();
        return;
      }
      router.push(`/products/${data.id}`);
    } catch (error) {
      alert("Scan failed.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <Header title="Scanner" />

      {/* Tabs */}
      <div className="flex p-2 m-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveTab("generate")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === "generate"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500"
          }`}
        >
          <QrCode size={16} /> Test QR
        </button>
        <button
          onClick={() => setActiveTab("scan")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
            activeTab === "scan"
              ? "bg-slate-900 text-white shadow-md"
              : "text-slate-500"
          }`}
        >
          <Camera size={16} /> Scan
        </button>
      </div>

      <div className="px-4">
        {activeTab === "scan" ? (
          // --- SCAN MODE ---
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border shadow-sm">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="font-bold text-slate-900">
                  Looking up Product...
                </p>
              </div>
            ) : (
              <QRScanner onScan={handleScan} />
            )}
            <p className="text-center text-xs text-slate-500">
              Switch to &qout;Test QR&qout; tab to find a code to scan.
            </p>
          </div>
        ) : (
          // --- GENERATE MODE (Product List) ---
          <div className="animate-in fade-in slide-in-from-left-4">
            <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100">
              <p className="text-sm text-blue-800">
                <strong>Test Mode:</strong> Tap any product below to view its QR
                code. You can scan it with another phone.
              </p>
            </div>

            {loadingProducts ? (
              <div className="text-center py-10 text-slate-400">
                Loading products...
              </div>
            ) : (
              <ProductList
                products={products}
                onProductClick={(p) => setSelectedProduct(p)} // Open Modal on click
              />
            )}
          </div>
        )}
      </div>

      {/* QR MODAL (Reusable) */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Test QR Code"
      >
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          <div className="bg-white p-4 rounded-xl border-2 border-slate-900 shadow-lg">
            {selectedProduct?.qr_url ? (
              <Image
                src={selectedProduct.qr_url}
                alt={selectedProduct.name}
                width={250}
                height={250}
                className="mix-blend-multiply"
              />
            ) : (
              <div className="w-[250px] h-[250px] flex items-center justify-center bg-slate-50 text-slate-400 text-sm">
                QR Not Generated
              </div>
            )}
          </div>
          <p className="font-mono text-xl font-bold tracking-widest text-slate-900">
            {selectedProduct?.sku}
          </p>
          <p className="text-xs text-slate-500 text-center">
            Go to &qout;Scan&qout; tab on another device to test this.
          </p>
        </div>
      </Modal>

      <BottomNav role="staff" />
    </div>
  );
}
