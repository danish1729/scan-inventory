"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import { ScanLine, ArrowRight, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // Only for Sign Up

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // --- SIGN UP LOGIC (Owner Only) ---

        // 1. Create Auth User
        // ✅ REPLACE WITH THIS
        const { data: authData, error: authError } = await supabase.auth.signUp(
          {
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                role: "owner", // Pass role here so the trigger sees it
              },
            },
          }
        );

        if (authError) throw authError;

        // Success! The SQL Trigger just created the profile for us.
        router.push("/dashboard");
      } else {
        // --- LOGIN LOGIC (Staff & Owner) ---

        const { data, error: loginError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (loginError) throw loginError;

        // Check Role for Redirect
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user?.id)
          .single();

        if (profile?.role === "staff") {
          router.push("/scan");
        } else {
          router.push("/dashboard");
        }

        router.refresh(); // Refresh server components to update middleware state
      }
    } catch (err: unknown) {
      setError((err as Error).message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-900 text-white shadow-xl mb-4">
            <ScanLine size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            ScanStock
          </h1>
          <p className="text-slate-500">
            {isSignUp
              ? "Create your store account"
              : "Login to manage inventory"}
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence mode="popLayout">
              {isSignUp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Input
                    label="Full Name"
                    placeholder="John Owner"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required={isSignUp}
                    className="mb-4"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <Input
              label="Email"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <Button type="submit" isLoading={loading} className="w-full mt-2">
              {isSignUp ? "Create Store" : "Sign In"}{" "}
              <ArrowRight size={16} className="ml-2" />
            </Button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {isSignUp ? (
                <span>
                  Already have an account?{" "}
                  <span className="text-blue-600 underline">Login</span>
                </span>
              ) : (
                <span>
                  New Store Owner?{" "}
                  <span className="text-blue-600 underline">
                    Create Account
                  </span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
