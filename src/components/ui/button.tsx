import Link from "next/link";
import { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "dark";

const base =
  "inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-200 px-6 py-3.5 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-soft",
  secondary: "border border-ink text-ink hover:bg-ink hover:text-paper",
  ghost: "text-ink hover:text-gray border-b border-transparent hover:border-ink px-0 py-1",
  dark: "bg-paper text-ink hover:bg-gray-light",
};

export function Button({
  children,
  href,
  variant = "primary",
  onClick,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  href?: string;
  variant?: Variant;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  const classes = `${base} ${variants[variant]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
