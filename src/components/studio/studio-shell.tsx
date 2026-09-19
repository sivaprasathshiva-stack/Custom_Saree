"use client";

import { useMemo, useState } from "react";
import { StatusBadge } from "@/components/ui/section-label";
import {
  StudioStep,
  steps,
  materials,
  palette,
  borders,
  pallus,
  zariOptions,
  manufacturabilityChecks,
  priceBreakdown,
} from "./studio-data";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function StudioShell() {
  const [activeStep, setActiveStep] = useState<StudioStep>("material");
  const [materialId, setMaterialId] = useState(materials[0].id);
  const [borderId, setBorderId] = useState(borders[0].id);
  const [palluId, setPalluId] = useState(pallus[0].id);
  const [zariId, setZariId] = useState(zariOptions[0].id);
  const [savedSecondsAgo] = useState(12);

  const material = materials.find((m) => m.id === materialId)!;
  const border = borders.find((b) => b.id === borderId)!;
  const pallu = pallus.find((p) => p.id === palluId)!;
  const zari = zariOptions.find((z) => z.id === zariId)!;

  const total = useMemo(
    () => priceBreakdown.reduce((s, l) => s + l.amount, 0) * (zari.multiplier / 1.8),
    [zari]
  );

  const worstStatus = manufacturabilityChecks.some((c) => c.status === "fail")
    ? "fail"
    : manufacturabilityChecks.some((c) => c.status === "review")
    ? "review"
    : manufacturabilityChecks.some((c) => c.status === "warning")
    ? "warning"
    : "pass";

  return (
    <div className="flex h-screen flex-col bg-charcoal text-ivory">
      {/* Top bar */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line-dark px-6">
        <div className="flex items-center gap-6">
          <span className="font-display text-lg tracking-wide">SĀRĪ Studio</span>
          <span className="h-4 w-px bg-line-dark" />
          <div className="flex flex-col leading-tight">
            <input
              defaultValue="Temple Geometry — Maroon Gold"
              className="bg-transparent font-mono text-xs uppercase tracking-[0.1em] text-ivory outline-none"
            />
            <span className="font-mono text-[10px] text-stone">
              Draft · Saved {savedSecondsAgo}s ago
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.15em]">
          <button className="rounded-none border border-line-dark px-3 py-2 text-stone-light hover:border-brass hover:text-brass">
            Undo
          </button>
          <button className="rounded-none border border-line-dark px-3 py-2 text-stone-light hover:border-brass hover:text-brass">
            Redo
          </button>
          <button className="rounded-none border border-line-dark px-3 py-2 text-stone-light hover:border-brass hover:text-brass">
            Version 1
          </button>
          <button className="rounded-none border border-line-dark px-3 py-2 text-stone-light hover:border-brass hover:text-brass">
            Share
          </button>
          <button className="bg-brass-bright px-4 py-2 text-charcoal hover:bg-ivory">
            Request Sample
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Left — creation controls */}
        <aside className="flex w-64 shrink-0 flex-col overflow-y-auto border-r border-line-dark thin-scroll">
          {steps.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveStep(s.id)}
              className={`flex items-start gap-3 border-b border-line-dark px-5 py-4 text-left transition-colors ${
                activeStep === s.id ? "bg-charcoal-soft" : "hover:bg-charcoal-soft/50"
              }`}
            >
              <span
                className={`font-mono text-[11px] ${
                  activeStep === s.id ? "text-brass-bright" : "text-stone"
                }`}
              >
                {s.index}
              </span>
              <span>
                <span
                  className={`block font-display text-base ${
                    activeStep === s.id ? "text-ivory" : "text-stone-light"
                  }`}
                >
                  {s.label}
                </span>
                <span className="block font-mono text-[10px] text-stone">{s.hint}</span>
              </span>
            </button>
          ))}
        </aside>

        {/* Center — canvas */}
        <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-charcoal-soft">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(90deg, var(--color-line-dark) 1px, transparent 1px), linear-gradient(0deg, var(--color-line-dark) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative flex aspect-[3/8] h-[70vh] flex-col border border-line-dark bg-charcoal shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
            {/* Pallu */}
            <div
              className="flex h-1/4 items-center justify-center border-b"
              style={{ backgroundColor: palette[0].hex, borderColor: palette[1].hex }}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ivory/70">
                Pallu — {pallu.name}
              </span>
            </div>
            {/* Body */}
            <div
              className="flex flex-1 items-center justify-center"
              style={{
                backgroundColor: palette[0].hex,
                backgroundImage:
                  "repeating-linear-gradient(45deg, rgba(246,242,234,0.05) 0, rgba(246,242,234,0.05) 2px, transparent 2px, transparent 14px)",
              }}
            >
              <span className="rotate-90 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.2em] text-ivory/50">
                Saree Body — {material.name}
              </span>
            </div>
            {/* Border strip */}
            <div
              className="flex items-center justify-center border-t"
              style={{
                backgroundColor: palette[1].hex,
                height: `${border.widthCm * 4}px`,
                borderColor: palette[1].hex,
              }}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-charcoal/70">
                {border.name}
              </span>
            </div>
          </div>
          <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.15em] text-stone">
            Technical Preview · Digital Concept — not a guaranteed physical result
          </p>
        </div>

        {/* Right — properties */}
        <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-line-dark thin-scroll">
          <div className="border-b border-line-dark p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone">
              {steps.find((s) => s.id === activeStep)?.label}
            </p>

            {activeStep === "material" && (
              <div className="mt-4 flex flex-col gap-2">
                {materials.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMaterialId(m.id)}
                    className={`border px-4 py-3 text-left transition-colors ${
                      m.id === materialId
                        ? "border-brass-bright bg-charcoal-soft"
                        : "border-line-dark hover:border-stone"
                    }`}
                  >
                    <span className="block font-display text-base">{m.name}</span>
                    <span className="mt-1 block font-mono text-[10px] text-stone">
                      {m.weight} · {m.width} · {m.sheen} sheen
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeStep === "colour" && (
              <div className="mt-4 flex flex-col gap-3">
                {palette.map((c) => (
                  <div key={c.slot} className="flex items-center justify-between border border-line-dark px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-6 w-6 border border-line-dark"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>
                        <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-stone">
                          {c.slot}
                        </span>
                        <span className="block text-sm">{c.name}</span>
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-stone">{c.hex}</span>
                  </div>
                ))}
                <p className="mt-2 font-mono text-[10px] leading-relaxed text-stone">
                  Screen colour is not an exact physical colour match. Request a swatch
                  to confirm.
                </p>
              </div>
            )}

            {activeStep === "artwork" && (
              <div className="mt-4 flex flex-col gap-4">
                <div className="flex flex-col items-center justify-center gap-2 border border-dashed border-line-dark px-4 py-10 text-center">
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone">
                    Drop artwork or click to upload
                  </span>
                  <span className="font-mono text-[9px] text-stone">PNG · JPG · SVG</span>
                </div>
                <p className="font-mono text-[10px] leading-relaxed text-stone">
                  I confirm I have the right to use this artwork for this project.
                </p>
              </div>
            )}

            {activeStep === "repeat" && (
              <div className="mt-4 flex flex-col gap-4">
                {["Straight", "Half-Drop", "Mirror", "Brick"].map((r, i) => (
                  <label key={r} className="flex items-center gap-3 font-mono text-xs">
                    <input type="radio" name="repeat" defaultChecked={i === 0} />
                    {r} Repeat
                  </label>
                ))}
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone">
                    Repeat Width — 18 cm
                  </span>
                  <input type="range" className="mt-2 w-full accent-brass-bright" defaultValue={50} />
                </div>
              </div>
            )}

            {activeStep === "border" && (
              <div className="mt-4 flex flex-col gap-2">
                {borders.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBorderId(b.id)}
                    className={`flex items-center justify-between border px-4 py-3 text-left transition-colors ${
                      b.id === borderId
                        ? "border-brass-bright bg-charcoal-soft"
                        : "border-line-dark hover:border-stone"
                    }`}
                  >
                    <span className="font-display text-base">{b.name}</span>
                    <span className="font-mono text-[10px] text-stone">{b.widthCm} cm</span>
                  </button>
                ))}
              </div>
            )}

            {activeStep === "pallu" && (
              <div className="mt-4 flex flex-col gap-2">
                {pallus.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPalluId(p.id)}
                    className={`border px-4 py-3 text-left font-display text-base transition-colors ${
                      p.id === palluId
                        ? "border-brass-bright bg-charcoal-soft"
                        : "border-line-dark hover:border-stone"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}

            {activeStep === "zari" && (
              <div className="mt-4 flex flex-col gap-2">
                {zariOptions.map((z) => (
                  <button
                    key={z.id}
                    onClick={() => setZariId(z.id)}
                    className={`flex items-center justify-between border px-4 py-3 text-left transition-colors ${
                      z.id === zariId
                        ? "border-brass-bright bg-charcoal-soft"
                        : "border-line-dark hover:border-stone"
                    }`}
                  >
                    <span className="font-display text-base">{z.name}</span>
                    <span className="font-mono text-[10px] text-stone">×{z.multiplier}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Technical specification */}
          <div className="border-b border-line-dark p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone">
              Technical Specification
            </p>
            <dl className="mt-4 flex flex-col gap-2 font-mono text-[11px]">
              {[
                ["Material", material.name],
                ["Weave", "Handloom · Jacquard"],
                ["Width", material.width],
                ["Weight", material.weight],
                ["Repeat", "18 × 18 cm"],
                ["Border", `${border.widthCm} cm · ${border.name}`],
                ["Zari", zari.name],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <dt className="text-stone">{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Manufacturability */}
          <div className="border-b border-line-dark p-5">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone">
                Manufacturability
              </p>
              <StatusBadge status={worstStatus} />
            </div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {manufacturabilityChecks.map((c) => (
                <li key={c.label} className="flex items-start justify-between gap-3 text-xs">
                  <span className="text-stone-light">{c.label}</span>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          </div>

          {/* Price */}
          <div className="p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone">
              Estimated Price
            </p>
            <dl className="mt-4 flex flex-col gap-2 font-mono text-[11px]">
              {priceBreakdown.map((l) => (
                <div key={l.label} className="flex items-center justify-between">
                  <dt className="text-stone">{l.label}</dt>
                  <dd>{inr.format(l.amount)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex items-center justify-between border-t border-line-dark pt-3 font-mono text-sm">
              <span>Estimated Total</span>
              <span className="text-brass-bright">{inr.format(total)}</span>
            </div>
            <p className="mt-2 font-mono text-[10px] text-stone">
              Estimated production: 25–32 days
            </p>
          </div>
        </aside>
      </div>

      {/* Bottom bar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-t border-line-dark px-6 font-mono text-[10px] uppercase tracking-[0.15em] text-stone">
        <div className="flex items-center gap-6">
          <span>Status: Draft</span>
          <span>Material: {material.name}</span>
          <span>Scale: 120px ≈ 12cm</span>
        </div>
        <div className="flex items-center gap-6">
          <span>Repeat: On</span>
          <span>Zoom 100%</span>
        </div>
      </div>
    </div>
  );
}
