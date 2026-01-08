"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Header } from "@/components/layout/Header";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import QRCode from "qrcode";

export default function AddProductPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    total_stock: "",
    main_location: "",
    main_qty: "",
    safety_location: "",
    safety_qty: "",
    unit_cost: "",
    is_expensive: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Validate: Ensure numeric fields are valid numbers
      const total = parseInt(formData.total_stock) || 0;
      const mainQty = parseInt(formData.main_qty) || 0;
      const safetyQty = parseInt(formData.safety_qty) || 0;

      // 2. Get Current User (Store Owner)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 3. Get Store ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("store_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // 4. Generate QR Code (Data URL)
      const qrDataUrl = await QRCode.toDataURL(formData.sku, { width: 400, margin: 1 });

      // 5. Convert Data URL to Blob for Upload
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      const fileName = `${profile.store_id}/${formData.sku}.png`;

      // 6. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("qrcode")
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      // 7. Get Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("qrcode").getPublicUrl(fileName);

      // 8. Insert Product into DB
      const { error: dbError } = await supabase.from("products").insert({
        store_id: profile.store_id,
        name: formData.name,
        sku: formData.sku,
        total_stock: total,
        main_location: formData.main_location,
        main_qty: mainQty,
        safety_location: formData.safety_location,
        safety_qty: safetyQty,
        unit_cost: parseFloat(formData.unit_cost),
        is_expensive: formData.is_expensive,
        qr_url: publicUrl,
      });

      if (dbError) throw dbError;

      // Success!
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      setError((err as Error).message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20 bg-slate-50 min-h-screen">
      <Header title="Add New Product" showBack />

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Basic Info */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <Input
            label="Product Name"
            name="name"
            placeholder="e.g. Green Matcha"
            required
            value={formData.name}
            onChange={handleChange}
          />
          <Input
            label="SKU (9-digit)"
            name="sku"
            placeholder="123456789"
            maxLength={9}
            required
            value={formData.sku}
            onChange={handleChange}
            className="font-mono tracking-widest"
          />
          <Input
            label="Unit Cost (¥)"
            name="unit_cost"
            type="number"
            required
            value={formData.unit_cost}
            onChange={handleChange}
          />
          <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <input
              type="checkbox"
              name="is_expensive"
              id="is_expensive"
              checked={formData.is_expensive}
              onChange={handleChange}
              className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
            />
            <label
              htmlFor="is_expensive"
              className="text-sm font-semibold text-amber-900"
            >
              High Value Item (Require confirmation)
            </label>
          </div>
        </div>

        {/* Inventory Locations */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900">Stock Locations</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Main Loc Name"
              name="main_location"
              placeholder="Shelf A"
              required
              value={formData.main_location}
              onChange={handleChange}
            />
            <Input
              label="Main Qty"
              name="main_qty"
              type="number"
              required
              value={formData.main_qty}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Safety Loc Name"
              name="safety_location"
              placeholder="Back Room"
              value={formData.safety_location}
              onChange={handleChange}
            />
            <Input
              label="Safety Qty"
              name="safety_qty"
              type="number"
              value={formData.safety_qty}
              onChange={handleChange}
            />
          </div>

          <div className="pt-2 border-t flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500">
              Total Calculated:
            </span>
            <input
              readOnly
              className="text-right font-bold text-lg bg-transparent outline-none w-20"
              value={
                (parseInt(formData.main_qty) || 0) +
                (parseInt(formData.safety_qty) || 0)
              }
              name="total_stock"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <Button type="submit" isLoading={loading}>
          Generate QR & Save Product
        </Button>
      </form>
    </div>
  );
}
