import Link from "next/link";
import { ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "dark" | "inverted";

const base =
  "inline-flex items-center justify-center gap-2 text-sm font-medium transition-colors duration-200 active:scale-[0.97] px-6 py-3.5 whitespace-nowrap";

const variants: Record<Variant, string> = {
  primary: "bg-ink text-paper hover:bg-ink-soft",
  secondary: "border border-ink text-ink hover:bg-ink hover:text-paper",
  ghost: "text-ink hover:text-gray border-b border-transparent hover:border-ink px-0 py-1",
  dark: "bg-paper text-ink hover:bg-gray-light",
  // For use on dark sections (e.g. the hero) where `secondary` would be
  // invisible — light border/text at rest, inverts to a solid light fill
  // with dark text on hover. Defined once here instead of overridden via
  // className per usage, which is what caused a white-on-white hover bug
  // previously (variant's own hover classes and a className override
  // targeting the same pseudo-state raced in the compiled CSS).
  inverted: "border border-paper text-paper hover:bg-paper hover:text-ink",
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
