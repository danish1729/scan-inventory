import React, { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "outline";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, children, isLoading, variant = "primary", disabled, ...props },
    ref
  ) => {
    const variants = {
      primary: "bg-slate-900 text-white hover:bg-slate-800",
      secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
      danger: "bg-red-600 text-white hover:bg-red-700",
      outline:
        "border-2 border-slate-200 bg-transparent hover:bg-slate-50 text-slate-900",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "flex items-center justify-center w-full rounded-xl px-4 py-3 font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          className
        )}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
