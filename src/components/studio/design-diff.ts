import type { SareeDesign } from "./types";

export interface DesignDiffRow {
  label: string;
  a: string;
  b: string;
  changed: boolean;
}

/**
 * Simple, honest field-level diff between two design snapshots — the
 * "comparison UI, not just storage" version-compare feature called out as
 * missing in docs/textile-studio/16-implementation-plan.md Phase 2. This is
 * a value diff (what changed), not a structural/3-way merge diff — a plain
 * side-by-side is the right scope for the current SareeDesign shape.
 */
export function diffDesigns(a: SareeDesign, b: SareeDesign): DesignDiffRow[] {
  const row = (label: string, av: string, bv: string): DesignDiffRow => ({
    label,
    a: av,
    b: bv,
    changed: av !== bv,
  });

  const rows: DesignDiffRow[] = [
    row("Name", a.name, b.name),
    row("Material", a.materialId, b.materialId),
    row("Weave", a.weaveId, b.weaveId),
    row("Base colour", a.paletteHexBySlot.base, b.paletteHexBySlot.base),
    row("Motif colour", a.paletteHexBySlot.motif, b.paletteHexBySlot.motif),
    row("Border colour", a.paletteHexBySlot.border, b.paletteHexBySlot.border),
    row("Pallu colour", a.paletteHexBySlot.pallu, b.paletteHexBySlot.pallu),
    row("Accent colour", a.paletteHexBySlot.accent, b.paletteHexBySlot.accent),
    row("Blouse colour", a.paletteHexBySlot.blouse, b.paletteHexBySlot.blouse),
    row("Border", a.borderId, b.borderId),
    row("Pallu", a.palluId, b.palluId),
    row("Zari", a.zariId, b.zariId),
    row("Repeat type", a.repeat.type, b.repeat.type),
    row("Repeat size", `${a.repeat.widthCm}×${a.repeat.heightCm}cm`, `${b.repeat.widthCm}×${b.repeat.heightCm}cm`),
    row("Artwork layers", String(a.artwork.layers.length), String(b.artwork.layers.length)),
  ];

  return rows;
}
