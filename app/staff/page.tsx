"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User, ShieldCheck, Plus, X } from "lucide-react";
import { Profile } from "@/types";

export default function StaffPage() {
  const supabase = createClient();
  const [staff, setStaff] = useState<Profile[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Load Staff List
  useEffect(() => {
    const fetchStaff = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get my store ID
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("store_id")
        .eq("id", user.id)
        .single();
      if (!myProfile) return;

      // Get all profiles with this store_id
      const { data: staffList } = await supabase
        .from("profiles")
        .select("*")
        .eq("store_id", myProfile.store_id)
        .neq("role", "owner"); // Don't show myself

      if (staffList) setStaff(staffList);
    };
    fetchStaff();
  }, []);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/staff", {
        method: "POST",
        body: JSON.stringify(newStaff),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Staff account created! They can now log in.");
      setShowAddForm(false);
      setNewStaff({ name: "", email: "", password: "" });
      // Reload page to see new staff
      window.location.reload();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      <Header title="Manage Staff" />

      <div className="p-4 space-y-4">
        {/* Add Staff Toggle */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-500 font-bold gap-2 hover:bg-slate-100"
          >
            <Plus size={20} /> Add New Staff Member
          </button>
        ) : (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold">New Staff Details</h3>
              <button onClick={() => setShowAddForm(false)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAddStaff} className="space-y-3">
              <Input
                placeholder="Full Name"
                value={newStaff.name}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, name: e.target.value })
                }
                required
              />
              <Input
                type="email"
                placeholder="Login Email"
                value={newStaff.email}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, email: e.target.value })
                }
                required
              />
              <Input
                type="password"
                placeholder="Create Password"
                value={newStaff.password}
                onChange={(e) =>
                  setNewStaff({ ...newStaff, password: e.target.value })
                }
                required
              />
              <Button type="submit" isLoading={isLoading}>
                Create Account
              </Button>
            </form>
          </div>
        )}

        {/* Staff List */}
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mt-6">
          Active Staff
        </h3>
        <div className="space-y-3">
          {staff.length === 0 && (
            <p className="text-slate-400 text-sm">No staff added yet.</p>
          )}

          {staff.map((s) => (
            <div
              key={s.id}
              className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{s.full_name}</p>
                  <p className="text-xs text-slate-500">Staff Access</p>
                </div>
              </div>
              <ShieldCheck size={18} className="text-green-500" />
            </div>
          ))}
        </div>
      </div>

      <BottomNav role="owner" />
    </div>
  );
}
