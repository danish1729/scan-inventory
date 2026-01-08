"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Header } from "@/components/layout/Header";
import { AlertCircle } from "lucide-react";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/client";

export default function AddProductPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
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
      // 1. Generate QR Code Image URL
      // We upload the image first so we can send the URL to the API
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get Store ID for filename
      const { data: profile } = await supabase
        .from("profiles")
        .select("store_id")
        .eq("id", user.id)
        .single();
      if (!profile) throw new Error("Profile not found");

      const qrDataUrl = await QRCode.toDataURL(formData.sku, { width: 400 });
      const res = await fetch(qrDataUrl);
      const blob = await res.blob();
      const fileName = `${profile.store_id}/${formData.sku}.png`;

      // Upload
      const { error: uploadError } = await supabase.storage
        .from("qrcode")
        .upload(fileName, blob, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("qrcode").getPublicUrl(fileName);

      // 2. Call the API (This handles the DB split)
      const apiRes = await fetch("/api/products/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          main_qty: parseInt(formData.main_qty) || 0,
          safety_qty: parseInt(formData.safety_qty) || 0,
          unit_cost: parseFloat(formData.unit_cost) || 0,
          qr_url: publicUrl,
        }),
      });

      const data = await apiRes.json();
      if (!apiRes.ok) throw new Error(data.error);

      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError((err as Error).message || "Failed to add product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-20 bg-slate-50 min-h-screen">
      <Header title="Add New Product" showBack />

      <form onSubmit={handleSubmit} className="p-4 space-y-6">
        {/* Product Info */}
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
            label="Unit Cost ($)"
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

        {/* Locations (The New Structure) */}
        <div className="bg-white p-4 rounded-xl shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900">Initial Stock</h3>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Main Location"
              name="main_location"
              placeholder="Shelf A"
              required
              value={formData.main_location}
              onChange={handleChange}
            />
            <Input
              label="Qty"
              name="main_qty"
              type="number"
              required
              value={formData.main_qty}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Safety Location"
              name="safety_location"
              placeholder="Back Room"
              required
              value={formData.safety_location}
              onChange={handleChange}
            />
            <Input
              label="Qty"
              name="safety_qty"
              type="number"
              required
              value={formData.safety_qty}
              onChange={handleChange}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <Button type="submit" isLoading={loading}>
          Save Product
        </Button>
      </form>
    </div>
  );
}
