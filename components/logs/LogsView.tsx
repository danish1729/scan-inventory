"use client";

import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import {
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  User,
} from "lucide-react";

interface LogEntry {
  id: string;
  action_type: "stock_in" | "stock_out" | "move";
  quantity: number;
  reason: string;
  created_at: string;
  location_from: string | null;
  location_to: string | null;
  products: { name: string; sku: string } | null;
  user_name: string | null;
}

export function LogsView({ logs }: { logs: LogEntry[] }) {
  // Helper to format timestamps locally
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <Header title="Activity Logs" showBack />

      <div className="p-4 space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <p>No activity recorded yet.</p>
          </div>
        ) : (
          logs.map((log: LogEntry) => (
            <div
              key={log.id}
              className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex gap-3"
            >
              {/* Icon Column */}
              <div
                className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                ${
                  log.action_type === "stock_in"
                    ? "bg-green-100 text-green-600"
                    : log.action_type === "stock_out"
                    ? "bg-red-100 text-red-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {log.action_type === "stock_in" && <ArrowDownLeft size={20} />}
                {log.action_type === "stock_out" && <ArrowUpRight size={20} />}
                {log.action_type === "move" && <ArrowRightLeft size={20} />}
              </div>

              {/* Details Column */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900 truncate">
                      {log.products?.name || "Unknown Product"}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono">
                      SKU: {log.products?.sku}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </span>
                </div>

                <div className="mt-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-bold ${
                        log.action_type === "stock_in"
                          ? "text-green-600"
                          : log.action_type === "stock_out"
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}
                    >
                      {log.action_type === "stock_out" ? "-" : "+"}
                      {log.quantity}
                    </span>

                    {log.action_type === "move" ? (
                      <span className="text-xs bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                        {log.location_from} <ArrowRight size={10} />{" "}
                        {log.location_to}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 italic">
                        via {log.reason}
                      </span>
                    )}
                  </div>
                </div>

                {/* User Info Footer */}
                <div className="mt-2 pt-2 border-t border-slate-50 flex items-center gap-1 text-xs text-slate-400">
                  <User size={12} />
                  <span>{log.user_name || "Unknown"}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav role="owner" />
    </div>
  );
}
