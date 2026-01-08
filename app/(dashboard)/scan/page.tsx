"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { QRScanner } from "@/components/features/QrScanner";
import { Header } from "@/components/layout/Header";
import { ProductList } from "@/components/shared/ProductList";
import { Modal } from "@/components/ui/Modal";
import { QrCode, Camera, Loader2 } from "lucide-react";
import { Product, ProductLocation } from "@/types";
import Image from "next/image";

export default function ScanPage() {
  const router = useRouter();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<"scan" | "generate">("generate");

  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // FETCH PRODUCTS FOR "TEST QR" TAB
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Products AND Join Locations
      // We look for 'locations' which comes from the 'product_locations' table
      const { data: rawData, error } = await supabase
        .from("products")
        .select(
          `
              *, 
              locations:product_locations(id, name, type, quantity)
            `
        )
        .order("name");

      if (error) {
        console.error("Error fetching products:", error);
      } else if (rawData) {
        // 2. Calculate Total Stock manually for the UI
        // We map over the raw data to add the 'total_stock' property
        const formatted: Product[] = rawData.map((p: Product) => ({
          ...p,
          // Safety check: ensure locations is an array before reducing
          total_stock: Array.isArray(p.locations)
            ? p.locations.reduce((sum: number, l: ProductLocation) => sum + l.quantity, 0)
            : 0,
        }));
        setProducts(formatted);
      }
      setLoadingProducts(false);
    };

    // Only fetch if we are on the generate tab
    if (activeTab === "generate") {
      fetchProducts();
    }
  }, [activeTab, supabase]);

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
      alert((error as Error).message || "Error scanning QR code.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen">
      <Header title="Scanner" />

      {/* TABS */}
      <div className="flex p-2 m-4 bg-white rounded-xl border border-slate-200 shadow-sm">
        <button
          onClick={() => setActiveTab("generate")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
            activeTab === "generate"
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <QrCode size={16} /> Test QR
        </button>
        <button
          onClick={() => setActiveTab("scan")}
          className={`flex-1 py-2 text-sm font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
            activeTab === "scan"
              ? "bg-slate-900 text-white"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Camera size={16} /> Scan
        </button>
      </div>

      <div className="px-4 pb-24">
        {activeTab === "scan" ? (
          // SCANNER VIEW
          <div className="space-y-6 animate-in fade-in">
            {isProcessing ? (
              <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border shadow-sm">
                <Loader2 className="animate-spin mb-2 text-blue-600" />
                <span className="text-sm font-bold text-slate-500">
                  Verifying Product...
                </span>
              </div>
            ) : (
              <QRScanner onScan={handleScan} />
            )}
            <p className="text-center text-xs text-slate-500">
              Point camera at a product QR Code.
            </p>
          </div>
        ) : (
          // LIST VIEW (For Testing)
          <div className="animate-in fade-in">
            {loadingProducts ? (
              <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="animate-spin" />
                <span className="text-sm">Loading inventory...</span>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 p-4 rounded-xl mb-4 border border-blue-100 text-sm text-blue-800">
                  <strong>Test Mode:</strong> Tap a product to view its QR code.
                </div>
                <ProductList
                  products={products}
                  onProductClick={(p) => setSelectedProduct(p)}
                />
              </>
            )}
          </div>
        )}
      </div>

      {/* QR MODAL */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        title="Test QR"
      >
        <div className="flex flex-col items-center p-6 space-y-4">
          <div className="bg-white p-2 rounded-xl border-2 border-slate-900 shadow-lg">
            {selectedProduct?.qr_url ? (
              <Image
                src={selectedProduct.qr_url}
                alt="QR"
                width={200}
                height={200}
                className="mix-blend-multiply"
              />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                No QR Generated
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="font-mono text-2xl font-bold tracking-widest text-slate-900">
              {selectedProduct?.sku}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {selectedProduct?.name}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
