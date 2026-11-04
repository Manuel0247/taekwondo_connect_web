import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

// Variantes et tailles de src/components/ui/Button.tsx (mobile)
type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "subtle" | "outline-secondary";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-[#d65c08] active:bg-[#c25307] shadow-[0_6px_20px_-8px_rgba(232,101,10,0.7)]",
  secondary: "bg-secondary text-white hover:bg-[#1e8a47] active:bg-[#176a36]",
  outline: "border-[1.5px] border-primary text-primary hover:bg-primary/10",
  "outline-secondary": "border-[1.5px] border-secondary-light text-secondary-light hover:bg-secondary/15",
  ghost: "text-muted hover:text-white hover:bg-white/5",
  danger: "bg-danger text-white hover:bg-[#c21f1f]",
  subtle: "bg-surface-3 text-white hover:bg-[#363638] border border-line",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px] rounded-sm gap-1.5",
  md: "h-12 px-6 text-[15px] rounded-md gap-2",
  lg: "h-14 px-8 text-[16px] rounded-lg gap-2",
  icon: "h-10 w-10 rounded-full",
};

type Common = {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function buttonClass({ variant = "primary", size = "md", fullWidth, className }: Omit<Common, "children" | "icon" | "loading">) {
  return cn(
    "inline-flex select-none items-center justify-center font-bold whitespace-nowrap transition-[background-color,color,opacity,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55",
    variants[variant],
    sizes[size],
    fullWidth && "w-full",
    className,
  );
}

export function Button({
  variant,
  size,
  loading,
  fullWidth,
  icon,
  className,
  children,
  disabled,
  type = "button",
  ...rest
}: Common & Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? <Spinner className="size-5" /> : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}

export function LinkButton({
  href,
  variant,
  size,
  fullWidth,
  icon,
  className,
  children,
  ...rest
}: Common & Omit<ComponentProps<typeof Link>, "children" | "className">) {
  return (
    <Link href={href} className={buttonClass({ variant, size, fullWidth, className })} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
