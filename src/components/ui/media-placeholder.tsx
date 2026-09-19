type MediaVariant =
  | "hero"
  | "editorial"
  | "product"
  | "material"
  | "macro"
  | "portrait"
  | "landscape"
  | "square"
  | "video"
  | "gallery"
  | "avatar"
  | "passport"
  | "process"
  | "craft"
  | "campaign";

type MediaPlaceholderProps = {
  label: string;
  ratio: string; // e.g. "aspect-[3/2]"
  variant?: MediaVariant;
  hint?: string;
  caption?: string;
  dark?: boolean;
  loading?: boolean;
  className?: string;
};

const VARIANT_ICON: Partial<Record<MediaVariant, string>> = {
  video: "▶",
  avatar: "◐",
  macro: "⊕",
  passport: "◈",
};

/**
 * Designed placeholder for media that hasn't been sourced yet. This is the
 * only media surface the application should render right now — real
 * photography/video comes in a later pass and drops in by swapping this
 * component for a <ResponsiveImage>/<ResponsiveVideo> without touching page
 * layout, since every caller already passes the final aspect ratio.
 *
 * Never a plain gray box: a thin diagonal hatch, a label naming what the
 * eventual asset is, and (for `avatar`) a circular crop so the footprint
 * still reads as intentional design, not a broken image.
 */
export function MediaPlaceholder({
  label,
  ratio,
  variant = "editorial",
  hint,
  caption,
  dark = false,
  loading = false,
  className = "",
}: MediaPlaceholderProps) {
  const rounded = variant === "avatar" ? "rounded-full" : "";
  const icon = VARIANT_ICON[variant];

  return (
    <figure className={className}>
      <div
        className={`relative ${ratio} w-full overflow-hidden border ${rounded} ${
          dark
            ? "border-line-dark bg-charcoal-soft text-stone-light"
            : "border-line bg-ivory-deep text-stone"
        }`}
      >
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, currentColor 0, currentColor 1px, transparent 1px, transparent 14px)",
          }}
        />
        <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
          {loading ? (
            <span className="h-4 w-4 animate-spin rounded-full border border-current border-t-transparent opacity-60" />
          ) : (
            <>
              {icon && <span className="text-base opacity-60">{icon}</span>}
              <span className="text-xs uppercase tracking-[0.15em] opacity-70">
                Media placeholder
              </span>
              <span className="font-display text-lg">{label}</span>
              {hint && <span className="text-xs opacity-60">{hint}</span>}
            </>
          )}
        </div>
      </div>
      {caption && (
        <figcaption className={`mt-2 text-xs ${dark ? "text-stone-light" : "text-stone"}`}>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
