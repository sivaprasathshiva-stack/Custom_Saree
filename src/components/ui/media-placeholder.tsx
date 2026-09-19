type MediaPlaceholderProps = {
  label: string;
  ratio: string; // e.g. "aspect-[3/2]"
  hint?: string;
  dark?: boolean;
  className?: string;
};

/**
 * Designed placeholder for unavailable media. Never a fake photo —
 * an explicit, on-brand slot the owner can later fill via the media library.
 */
export function MediaPlaceholder({
  label,
  ratio,
  hint,
  dark = false,
  className = "",
}: MediaPlaceholderProps) {
  return (
    <div
      className={`relative ${ratio} w-full overflow-hidden border ${
        dark
          ? "border-line-dark bg-charcoal-soft text-stone-light"
          : "border-line bg-ivory-deep text-stone"
      } ${className}`}
    >
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: `repeating-linear-gradient(135deg, currentColor 0, currentColor 1px, transparent 1px, transparent 14px)`,
        }}
      />
      <div className="relative flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-center">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-70">
          Media Placeholder
        </span>
        <span className="font-display text-lg italic">{label}</span>
        {hint && (
          <span className="font-mono text-[10px] uppercase tracking-[0.15em] opacity-60">
            {hint}
          </span>
        )}
      </div>
    </div>
  );
}
