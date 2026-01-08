"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function useProductLookup() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const lookupSku = async (sku: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/products/lookup", {
        method: "POST",
        body: JSON.stringify({ sku }),
      });

      const data = await res.json();

      if (!res.ok || !data.found) {
        throw new Error("Product not found");
      }

      // Navigate to product
      router.push(`/products/${data.id}`);
      return true;
    } catch (error: unknown) {
      alert((error as Error).message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { lookupSku, loading };
}
