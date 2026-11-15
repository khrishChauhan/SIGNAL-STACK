"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "brand";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium select-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none rounded-lg active:scale-[0.98]";

    const variants = {
      primary: "bg-slate-900 text-white hover:bg-slate-800 shadow-subtle border border-slate-900",
      brand: "bg-blue-600 text-white hover:bg-blue-700 shadow-subtle border border-blue-600",
      secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200/60",
      outline: "border border-slate-300/80 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400/80 shadow-subtle",
      ghost: "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80",
      danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-subtle border border-rose-600",
    };

    const sizes = {
      sm: "h-8 px-2.5 text-xs gap-1.5",
      md: "h-9 px-3.5 text-xs font-semibold gap-2",
      lg: "h-10 px-5 text-sm font-semibold gap-2.5",
      icon: "h-8 w-8 p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-0.5 mr-2 h-3.5 w-3.5 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
