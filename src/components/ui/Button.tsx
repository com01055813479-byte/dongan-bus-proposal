import { cn } from "@/lib/utils/cn";
import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

/**
 * Toss 스타일 버튼:
 * - Primary: 단색 블루, 진한 그림자 없음, hover에 살짝 어두워짐
 * - Secondary: 연한 회색 배경
 * - Ghost: 배경 없음, hover에 연한 배경
 */
const variantClasses = {
  primary:
    "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white",
  secondary:
    "bg-[var(--bg-soft)] hover:bg-[var(--border)] text-[var(--text-strong)]",
  ghost:
    "hover:bg-[var(--bg-soft)] text-[var(--text-base)]",
  danger:
    "bg-rose-500 hover:bg-rose-600 text-white",
};

const sizeClasses = {
  sm: "px-3 py-2 text-sm rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
  lg: "px-5 py-3 text-base rounded-xl font-bold",
};

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-semibold transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]",
        variantClasses[variant],
        sizeClasses[size],
        disabled && "opacity-40 cursor-not-allowed",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
