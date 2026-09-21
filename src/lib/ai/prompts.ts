/**
 * Versioned prompt registry (requirements §62).
 *
 * Production prompts are never undocumented string literals scattered through
 * source files. Each one is registered here with an id and a version; the
 * version is written onto every artifact the prompt produced (§64), so a
 * concept generated last month can still be explained, reproduced or compared
 * against a newer prompt.
 *
 * Changing a prompt's text REQUIRES bumping its version. Never edit an
 * existing version in place — add a new one and flip `active`.
 */

import type { Composition } from "@/domain/composition";
import { imageObjects, textObjects } from "@/domain/composition";
import type { SareeAnalysisResult } from "@/domain/types";

export interface PromptTemplate {
  id: string;
  version: string;
  active: boolean;
  /** What this prompt is for, in one line. */
  description: string;
  render: (variables: PromptVariables) => string;
}

export interface PromptVariables {
  analysis: SareeAnalysisResult | null;
  composition: Composition;
  refinement: string | null;
}

function describePlacement(composition: Composition): string {
  const parts: string[] = [];
  for (const object of imageObjects(composition)) {
    parts.push(
      `an applied motif centred at ${object.x.toFixed(2)},${object.y.toFixed(2)} ` +
        `at ${(object.scale * 100).toFixed(0)}% scale, rotated ${object.rotation.toFixed(0)} degrees`,
    );
  }
  for (const object of textObjects(composition)) {
    parts.push(
      `the words "${object.text}" centred at ${object.x.toFixed(2)},${object.y.toFixed(2)} ` +
        `at ${(object.scale * 100).toFixed(0)}% scale`,
    );
  }
  return parts.length > 0 ? parts.join("; ") : "no applied artwork";
}

function describeAnalysis(analysis: SareeAnalysisResult | null): string {
  if (!analysis) return "an unanalysed saree reference";
  const colours = analysis.dominantColours.slice(0, 4).join(", ") || "unspecified colours";
  const motifs = analysis.motifs.slice(0, 4).join(", ") || "no recorded motifs";
  return `a saree whose dominant colours are ${colours}, with existing motifs: ${motifs}`;
}

const WOVEN_CONCEPT_V1: PromptTemplate = {
  id: "WOVEN_CONCEPT_PROMPT",
  version: "1",
  active: false,
  description: "First woven-concept prompt. Superseded by v2, kept for provenance.",
  render: ({ analysis, composition }) =>
    `Render ${describeAnalysis(analysis)} as woven silk, incorporating ${describePlacement(composition)}.`,
};

const WOVEN_CONCEPT_V2: PromptTemplate = {
  id: "WOVEN_CONCEPT_PROMPT",
  version: "2",
  active: true,
  description:
    "Woven-concept prompt emphasising real weave structure and zari, not a printed overlay.",
  render: ({ analysis, composition, refinement }) => {
    const base = [
      "Produce a photorealistic visualisation of a handwoven silk saree.",
      `The source is ${describeAnalysis(analysis)}.`,
      `Incorporate ${describePlacement(composition)}.`,
      "The applied artwork and lettering must read as WOVEN INTO the textile —",
      "following the weft, interrupted by the weave structure, catching light like zari —",
      "never as a flat print or digital overlay laid on top of the cloth.",
      "Preserve the saree's existing border and pallu structure.",
      "Natural daylight, no studio gloss, no added text or watermarks.",
    ];
    if (refinement) base.push(`Refinement requested: ${refinement}.`);
    return base.join(" ");
  },
};

const SAREE_ANALYSIS_V1: PromptTemplate = {
  id: "SAREE_ANALYSIS_PROMPT",
  version: "1",
  active: true,
  description: "Vision prompt for segmenting body / border / pallu and reading colour.",
  render: () =>
    [
      "Analyse this photograph of a saree.",
      "Identify the saree's outer boundary, and the body, border and pallu regions,",
      "each as a normalized bounding box with coordinates between 0 and 1.",
      "Report the dominant colours as hex values, any recognisable motifs,",
      "and an image-quality score between 0 and 1.",
      "Respond only with the requested structured fields.",
    ].join(" "),
};

const DRAPE_V1: PromptTemplate = {
  id: "DRAPE_PROMPT",
  version: "1",
  active: true,
  description: "Drape prompt for presenting a woven concept on the NILA model.",
  render: () =>
    [
      "Present this woven silk saree draped on a single consistent female model.",
      "Full length, neutral studio background, even daylight.",
      "The textile's pattern, border and pallu must remain faithful to the source image.",
    ].join(" "),
};

const REGISTRY: PromptTemplate[] = [
  WOVEN_CONCEPT_V1,
  WOVEN_CONCEPT_V2,
  SAREE_ANALYSIS_V1,
  DRAPE_V1,
];

export class UnknownPromptError extends Error {
  constructor(id: string) {
    super(`No active prompt registered for ${id}.`);
    this.name = "UnknownPromptError";
  }
}

/** The currently active template for a prompt id. */
export function activePrompt(id: string): PromptTemplate {
  const template = REGISTRY.find((entry) => entry.id === id && entry.active);
  if (!template) throw new UnknownPromptError(id);
  return template;
}

/** A specific historical version, used when reproducing an old concept. */
export function promptVersion(id: string, version: string): PromptTemplate | undefined {
  return REGISTRY.find((entry) => entry.id === id && entry.version === version);
}

export function allPrompts(): readonly PromptTemplate[] {
  return REGISTRY;
}
