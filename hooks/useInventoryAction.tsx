"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ActionParams {
  productId: string;
  action: "stock_in" | "stock_out" | "move";
  quantity: number;
  reason: string;
  locationType: "main" | "safety"; // For In/Out
  moveFromType?: "main" | "safety"; // For Move
}

export function useInventoryAction() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const executeAction = async (params: ActionParams) => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/action", {
        method: "POST",
        body: JSON.stringify(params),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Action failed");
      }

      // Success: Refresh the server data without reloading the browser
      router.refresh();
      return { success: true };
    } catch (error: unknown) {
      alert((error as Error).message);
      return { success: false, error: (error as Error).message };
    } finally {
      setLoading(false);
    }
  };

  return { executeAction, loading };
}
