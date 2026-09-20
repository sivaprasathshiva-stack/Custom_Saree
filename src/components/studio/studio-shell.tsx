"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/ui/section-label";
import { BackButton } from "@/components/ui/back-button";
import {
  StudioStep,
  steps,
  materials,
  borders,
  pallus,
  zariOptions,
  weaves,
  weavesForMaterial,
} from "./studio-data";
import { createDefaultDesign } from "./design-reducer";
import { useDesignHistory } from "./use-design-history";
// NOTE: pricing-engine.ts is intentionally not imported/rendered here.
// Per the PRD, Studio never shows a live estimated cost during editing (or
// on the Concept Review screen) — the estimate logic is a demo/internal
// tool, kept in the codebase for possible future admin use, but must not
// set customer price expectations before a design is reviewed by the
// textile team. See pricing-engine.ts's own header comment.
import { checkManufacturability, overallStatus } from "./manufacturability-engine";
import {
  loadCurrentDesign,
  saveCurrentDesign,
  loadVersions,
  saveVersions,
} from "./local-design-store";
import {
  getUser,
  loadCurrentDesignCloud,
  saveCurrentDesignCloud,
  loadVersionsCloud,
  saveVersionCloud,
  getOrCreateDesignId,
} from "./cloud-design-store";
import type { ArtworkLayer, DesignVersion, SareeDesign, ManufacturabilityCheck } from "./types";
import type { DesignAction } from "./design-reducer";
import { diffDesigns } from "./design-diff";
import type { User } from "@supabase/supabase-js";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

type SaveStatus = "idle" | "saving" | "saved" | "failed";

const AUTOSAVE_DEBOUNCE_MS = 1500;

/**
 * Renders one artwork layer's image (or its re-upload placeholder) at its
 * saved transform. `draggable` is only true for body placement, which is
 * the one region with a real drag-to-position drop target
 * (onArtworkPointerDown/Move/Up in StudioShell) — border/pallu placement
 * (PRD §13/§17) centers the layer in its strip; full per-region dragging is
 * Phase 6/7 canvas-engine scope, not this pass.
 */
function ArtworkLayerPreview({ layer, draggable = false }: { layer: ArtworkLayer; draggable?: boolean }) {
  const style = draggable
    ? {
        position: "absolute" as const,
        left: `${50 + layer.transform.x}%`,
        top: `${50 + layer.transform.y}%`,
        transform: `translate(-50%, -50%) scale(${layer.transform.scale}) rotate(${layer.transform.rotation}deg)`,
      }
    : {
        transform: `scale(${layer.transform.scale}) rotate(${layer.transform.rotation}deg)`,
      };

  return (
    <div style={style}>
      {layer.dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={layer.dataUrl}
          alt={layer.name}
          className="max-h-32 max-w-32 object-contain"
          draggable={false}
        />
      ) : (
        // A design loaded from the cloud stores artwork metadata only
        // (Phase 2 — no base64 in the DB blob); pixel data isn't synced
        // across devices until Phase 4's object storage lands, so this
        // layer needs re-upload here.
        <div className="flex h-24 w-24 flex-col items-center justify-center gap-1 border border-dashed border-line-dark bg-charcoal-soft px-2 text-center">
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-stone">{layer.fileName}</span>
          <span className="font-mono text-[8px] text-stone">Re-upload to view</span>
        </div>
      )}
    </div>
  );
}

// PRODUCT RULE — do not add a download/export affordance here (PRD §25/§30,
// NFR-018 "no customer export"). No PNG/JPG/PDF/SVG/JSON/3D-file download of
// any kind is ever offered to the customer, from any Studio surface — this
// is deliberate IP protection, not an oversight. If you're tempted to add a
// "Save image"/"Export"/"Download" button to this component or its preview
// canvas, don't — that capability belongs only in the (not-yet-built)
// designer/admin workspace, and even there it needs a product decision
// first. The preview canvas below also blocks the browser's own
// right-click "Save image as…" via onContextMenu — see that handler.
export function StudioShell() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState<StudioStep>("material");
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [savedSecondsAgo, setSavedSecondsAgo] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [versions, setVersions] = useState<DesignVersion[]>(() => loadVersions());
  const [compareIds, setCompareIds] = useState<[string, string] | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const cloudDesignId = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);

  const {
    design,
    dispatch,
    undo,
    redo,
    canUndo,
    canRedo,
    reset,
    beginTransformCheckpoint,
    commitTransformCheckpoint,
  } = useDesignHistory(createDefaultDesign());

  // Load any previously saved design on mount (client-only — localStorage
  // isn't available during server render, so this can't be a lazy useState
  // initializer the way `versions` is; it has to run post-mount). A saved
  // session always wins over a ?preset=/?material= link — both are a
  // starting point, never something that should clobber in-progress work.
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const currentUser = await getUser();
      if (cancelled) return;
      setUser(currentUser);

      // Signed-in users: the cloud copy is the source of truth (falls back
      // to any local draft only if nothing has been saved to the cloud yet,
      // e.g. right after signing up on a browser that already had a guest
      // draft in localStorage).
      if (currentUser) {
        const cloudDesign = await loadCurrentDesignCloud(currentUser.id);
        if (cancelled) return;
        if (cloudDesign) {
          reset(cloudDesign);
          const cloudVersions = await loadVersionsCloud(currentUser.id);
          if (!cancelled) setVersions(cloudVersions);
          hasLoadedRef.current = true;
          return;
        }
      }

      const saved = loadCurrentDesign();
      if (saved) {
        reset(saved);
        hasLoadedRef.current = true;
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const presetId = params.get("preset");
      if (presetId) {
        reset(createDefaultDesign(presetId));
        hasLoadedRef.current = true;
        return;
      }
      // Material-card handoff from the homepage/materials pages, e.g.
      // /studio?material=kan — pre-selects that silk on a fresh design
      // without inventing a separate material-selection state.
      const materialId = params.get("material");
      if (materialId && materials.some((m) => m.id === materialId)) {
        const base = createDefaultDesign();
        reset({ ...base, materialId });
        hasLoadedRef.current = true;
        return;
      }

      // Nothing saved anywhere (no cloud design, no local draft) and no
      // preset/material handoff from a marketing page — this is a genuinely
      // fresh signed-in visit to /studio with nothing chosen yet. Rather
      // than silently rendering a hard-coded default saree (materials[0]
      // etc. from createDefaultDesign()) as if the customer had picked it,
      // send them to the real "Choose a saree base" entry point (PRD's
      // Create Design flow) so the first material they see in the editor is
      // one they actually selected. Only signed-in users reach this branch
      // (StudioShell only mounts post sign-in when Supabase is configured;
      // in the unconfigured/local-demo fallback there is no per-user cloud
      // state to check, so the default design is kept as a working demo).
      if (currentUser) {
        router.replace("/studio/new");
        return;
      }
      hasLoadedRef.current = true;
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [reset, router]);

  // "Saved Ns ago" ticker.
  useEffect(() => {
    if (lastSavedAt === null) return;
    const interval = setInterval(() => {
      setSavedSecondsAgo(Math.round((Date.now() - lastSavedAt) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [lastSavedAt]);

  // Real Saving/Saved/Failed states (§51): local save is synchronous and
  // essentially can't fail (aside from storage quota), so "failed" here
  // reflects the cloud write specifically — the state most worth surfacing
  // since it's the one silent-data-loss risk (a user believing their work
  // reached their account when it didn't).
  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    setSaveError(null);
    const localOk = saveCurrentDesign(design);
    if (localOk) {
      setLastSavedAt(Date.now());
      setSavedSecondsAgo(0);
    }
    if (!user) {
      setSaveStatus(localOk ? "saved" : "failed");
      if (!localOk) setSaveError("Couldn't save to this device (local storage unavailable).");
      return;
    }
    try {
      const cloudOk = await saveCurrentDesignCloud(user.id, design);
      setSaveStatus(cloudOk ? "saved" : "failed");
      if (!cloudOk) setSaveError("Couldn't save to your account. Check your connection and retry.");
    } catch {
      setSaveStatus("failed");
      setSaveError("Couldn't reach the server. Check your connection and retry.");
    }
  }, [design, user]);

  // Autosave: debounced 1.5s after any design change (§52/14-performance-strategy.md),
  // so it doesn't fire per-keystroke/per-drag-tick. Skipped until the initial
  // load (cloud/local/preset) has resolved, so autosave never clobbers a
  // cloud design with the transient default design shown before load.
  useEffect(() => {
    if (!hasLoadedRef.current) return;
    const timer = setTimeout(() => {
      handleSave();
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [design]);

  // Keyboard shortcuts.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      if (e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      } else if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      } else if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo, redo, handleSave]);

  // Complete Design (PRD §23-24): make sure the current design has a stable
  // cloud id, then hand off to the Concept Review screen. Requires a signed
  // -in user because submissions are tied to a real designs.id row —
  // matches how version history already behaves (getOrCreateDesignId).
  const handleCompleteDesign = useCallback(async () => {
    await handleSave();
    if (!user) {
      router.push("/studio");
      return;
    }
    const designId = cloudDesignId.current ?? (await getOrCreateDesignId(user.id, design));
    cloudDesignId.current = designId;
    if (designId) {
      router.push(`/studio/${designId}/complete`);
    }
  }, [design, handleSave, router, user]);

  const handleSaveVersion = useCallback(() => {
    const version: DesignVersion = {
      id: `v${Date.now()}`,
      label: `${design.name} — ${new Date().toLocaleString()}`,
      createdAt: new Date().toISOString(),
      design,
    };
    const next = [...versions, version];
    setVersions(next);
    saveVersions(next);
    handleSave();
    if (user) {
      (async () => {
        const designId = cloudDesignId.current ?? (await getOrCreateDesignId(user.id, design));
        cloudDesignId.current = designId;
        if (designId) saveVersionCloud(user.id, designId, version);
      })();
    }
  }, [design, versions, handleSave, user]);

  const handleRestoreVersion = useCallback(
    (version: DesignVersion) => {
      reset(version.design);
    },
    [reset]
  );

  // Artwork upload.
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;

      if (!ACCEPTED_TYPES.includes(file.type)) {
        dispatch({
          type: "ARTWORK_UPLOAD_ERROR",
          error: `"${file.name}" is a ${file.type || "file"} we don't support. Use PNG, JPG or SVG.`,
        });
        return;
      }
      if (file.size > MAX_FILE_BYTES) {
        dispatch({
          type: "ARTWORK_UPLOAD_ERROR",
          error: `"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is 8 MB.`,
        });
        return;
      }

      dispatch({ type: "ARTWORK_UPLOAD_START" });

      const reader = new FileReader();
      reader.onerror = () => {
        dispatch({ type: "ARTWORK_UPLOAD_ERROR", error: "Couldn't read that file. Try again." });
      };
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Brief, honestly-labelled local processing delay — this is not an
        // AI analysis step, just giving the "preparing artwork" state a
        // moment to be visible rather than flashing instantly.
        setTimeout(() => {
          const layer: ArtworkLayer = {
            id: `layer-${Date.now()}`,
            name: file.name.replace(/\.[^.]+$/, ""),
            visible: true,
            placement: "body",
            dataUrl,
            fileName: file.name,
            transform: { x: 0, y: 0, scale: 1, rotation: 0 },
          };
          dispatch({ type: "ARTWORK_READY", layer });
        }, 500);
      };
      reader.readAsDataURL(file);
    },
    [dispatch]
  );

  // Drag-to-position the active artwork layer on the canvas.
  const dragState = useRef<{ layerId: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const activeLayer = design.artwork.layers.find((l) => l.id === design.artwork.activeLayerId);

  const onArtworkPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!activeLayer) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      beginTransformCheckpoint(design);
      dragState.current = {
        layerId: activeLayer.id,
        startX: e.clientX,
        startY: e.clientY,
        origX: activeLayer.transform.x,
        origY: activeLayer.transform.y,
      };
    },
    [activeLayer, beginTransformCheckpoint, design]
  );

  const onArtworkPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const d = dragState.current;
      if (!d) return;
      const dx = ((e.clientX - d.startX) / 140) * 100;
      const dy = ((e.clientY - d.startY) / 260) * 100;
      dispatch({
        type: "ARTWORK_TRANSFORM",
        layerId: d.layerId,
        transform: {
          x: Math.max(-50, Math.min(50, d.origX + dx)),
          y: Math.max(-50, Math.min(50, d.origY + dy)),
        },
      });
    },
    [dispatch]
  );

  const onArtworkPointerUp = useCallback(() => {
    if (!dragState.current) return;
    dragState.current = null;
    commitTransformCheckpoint();
  }, [commitTransformCheckpoint]);

  const setScale = (scale: number) => {
    if (!activeLayer) return;
    beginTransformCheckpoint(design);
    dispatch({ type: "ARTWORK_TRANSFORM", layerId: activeLayer.id, transform: { scale } });
    commitTransformCheckpoint();
  };

  const setRotation = (rotation: number) => {
    if (!activeLayer) return;
    beginTransformCheckpoint(design);
    dispatch({ type: "ARTWORK_TRANSFORM", layerId: activeLayer.id, transform: { rotation } });
    commitTransformCheckpoint();
  };

  // Defensive fallbacks (not `!` non-null assertions): a design loaded from
  // the cloud can carry an id that no longer matches the current catalog
  // (e.g. an older design saved before a catalog entry was renamed/removed)
  // — falling back to the first catalog entry avoids a hard render crash in
  // that case rather than throwing "Cannot read properties of undefined".
  const material = materials.find((m) => m.id === design.materialId) ?? materials[0];
  const weave = weaves.find((w) => w.id === design.weaveId) ?? weaves[0];
  const border = borders.find((b) => b.id === design.borderId) ?? borders[0];
  const pallu = pallus.find((p) => p.id === design.palluId) ?? pallus[0];
  const zari = zariOptions.find((z) => z.id === design.zariId) ?? zariOptions[0];

  const checks = useMemo(() => checkManufacturability(design), [design]);
  const status = overallStatus(checks);

  const tileCm = design.repeat.widthCm;
  const tilePx = Math.max(24, Math.min(96, tileCm * 3));

  function openStep(step: StudioStep) {
    setActiveStep(step);
    setMobilePanelOpen(true);
  }

  return (
    <div className="flex h-screen flex-col bg-charcoal text-ivory">
      {/* Top bar */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-line-dark px-4 md:px-6">
        <div className="flex items-center gap-4 md:gap-6">
          <BackButton
            forceHref="/studio/designs"
            label="My Designs"
            className="text-stone-light hover:text-brass-bright"
          />
          <span className="hidden h-4 w-px bg-line-dark md:block" />
          <div className="flex items-center gap-2">
            <Image
              src="/assets/brand/velvorea/velvorea-logo-white.png"
              alt="VELVOREA"
              width={28}
              height={28}
              className="h-6 w-6 object-contain"
            />
            <span className="font-display text-lg tracking-wide">VELVOREA</span>
          </div>
          <span className="hidden h-4 w-px bg-line-dark md:block" />
          <div className="hidden flex-col leading-tight md:flex">
            <input
              value={design.name}
              onChange={(e) => dispatch({ type: "SET_NAME", name: e.target.value })}
              className="bg-transparent font-mono text-xs uppercase tracking-[0.1em] text-ivory outline-none"
              aria-label="Design name"
            />
            <span className="flex items-center gap-2 font-mono text-[10px] text-stone">
              {saveStatus === "saving" && "Saving…"}
              {saveStatus === "failed" && (
                <>
                  <span className="text-danger">{saveError ?? "Save failed"}</span>
                  <button
                    onClick={handleSave}
                    className="text-brass-bright underline underline-offset-2 hover:text-brass"
                  >
                    Retry
                  </button>
                </>
              )}
              {saveStatus !== "saving" &&
                saveStatus !== "failed" &&
                (savedSecondsAgo === null
                  ? "Not saved yet"
                  : savedSecondsAgo === 0
                  ? user
                    ? "Saved to your account"
                    : "Saved on this device"
                  : `Saved ${savedSecondsAgo}s ago`)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.15em] md:gap-3">
          {!user && (
            <Link
              href="/auth/login?next=/studio"
              className="hidden border border-line-dark px-2.5 py-2 text-stone-light hover:border-brass hover:text-brass md:inline-flex md:px-3"
            >
              Sign in to save
            </Link>
          )}
          <button
            onClick={undo}
            disabled={!canUndo}
            className="rounded-none border border-line-dark px-2.5 py-2 text-stone-light hover:border-brass hover:text-brass disabled:opacity-30 disabled:hover:border-line-dark disabled:hover:text-stone-light md:px-3"
          >
            Undo
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="rounded-none border border-line-dark px-2.5 py-2 text-stone-light hover:border-brass hover:text-brass disabled:opacity-30 disabled:hover:border-line-dark disabled:hover:text-stone-light md:px-3"
          >
            Redo
          </button>
          <button
            onClick={handleSave}
            className="hidden rounded-none border border-line-dark px-3 py-2 text-stone-light hover:border-brass hover:text-brass md:block"
          >
            Save
          </button>
          <button
            onClick={handleSaveVersion}
            className="hidden rounded-none border border-line-dark px-3 py-2 text-stone-light hover:border-brass hover:text-brass lg:block"
          >
            Save version ({versions.length})
          </button>
          <button
            onClick={handleCompleteDesign}
            className="bg-brass-bright px-3 py-2 text-charcoal hover:bg-ivory md:px-4"
          >
            Complete Design
          </button>
        </div>
      </div>

      {/* Mobile step tabs */}
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-line-dark px-3 py-2 thin-scroll lg:hidden">
        {steps.map((s) => (
          <button
            key={s.id}
            onClick={() => openStep(s.id)}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-xs ${
              activeStep === s.id && mobilePanelOpen
                ? "bg-ivory text-charcoal"
                : "text-stone-light"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Left — creation controls (desktop only) */}
        <aside className="hidden w-64 shrink-0 flex-col overflow-y-auto border-r border-line-dark thin-scroll lg:flex">
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
          <div
            className="relative flex aspect-[3/8] h-[62vh] flex-col border border-line-dark bg-charcoal shadow-[0_0_0_1px_rgba(255,255,255,0.02)] md:h-[70vh]"
            // No-export product rule (PRD §30): the Studio never offers a
            // download/save-image affordance for this preview — see the
            // guard note above the return statement of StudioShell. This
            // only blocks the browser's own right-click "Save image as…",
            // it does not affect keyboard/assistive-tech interaction.
            onContextMenu={(e) => e.preventDefault()}
          >
            {/* Pallu */}
            <div
              className="relative flex h-1/4 items-center justify-center border-b"
              style={{
                backgroundColor: design.paletteHexBySlot.base,
                borderColor: design.paletteHexBySlot.border,
              }}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ivory/70">
                Pallu — {pallu.name}
              </span>
              {activeLayer && (activeLayer.placement ?? "body") === "pallu" && (
                <ArtworkLayerPreview layer={activeLayer} />
              )}
            </div>
            {/* Body — repeat tile + artwork drop target */}
            <div
              className="relative flex flex-1 touch-none items-center justify-center overflow-hidden"
              style={{
                backgroundColor: design.paletteHexBySlot.base,
                backgroundImage:
                  design.repeat.type === "brick"
                    ? `repeating-linear-gradient(0deg, rgba(246,242,234,0.06) 0, rgba(246,242,234,0.06) 1px, transparent 1px, transparent ${tilePx}px), repeating-linear-gradient(90deg, rgba(246,242,234,0.06) 0, rgba(246,242,234,0.06) 1px, transparent 1px, transparent ${tilePx}px)`
                    : "repeating-linear-gradient(45deg, rgba(246,242,234,0.05) 0, rgba(246,242,234,0.05) 2px, transparent 2px, transparent 14px)",
                backgroundSize: design.repeat.type === "brick" ? `${tilePx}px ${tilePx}px` : undefined,
              }}
              onPointerMove={onArtworkPointerMove}
              onPointerUp={onArtworkPointerUp}
            >
              {activeLayer && (activeLayer.placement ?? "body") === "body" ? (
                <div onPointerDown={onArtworkPointerDown} className="absolute cursor-grab touch-none select-none active:cursor-grabbing">
                  <ArtworkLayerPreview layer={activeLayer} draggable />
                </div>
              ) : !activeLayer ? (
                <span className="rotate-90 whitespace-nowrap font-mono text-[9px] uppercase tracking-[0.2em] text-ivory/50">
                  Saree body — {material.name}
                </span>
              ) : null}
            </div>
            {/* Border strip */}
            <div
              className="relative flex items-center justify-center border-t"
              style={{
                backgroundColor: design.paletteHexBySlot.border,
                height: `${border.widthCm * 4}px`,
                borderColor: design.paletteHexBySlot.border,
              }}
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-charcoal/70">
                {border.name}
              </span>
              {activeLayer && (activeLayer.placement ?? "body") === "border" && (
                <ArtworkLayerPreview layer={activeLayer} />
              )}
            </div>
          </div>
          {/* Guardrail 1 (PRD §73): never call this a "final saree preview" —
              always "Digital textile concept preview." */}
          <p className="mt-6 max-w-xs px-4 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-stone">
            Digital textile concept preview — not a guaranteed physical result
          </p>
        </div>

        {/* Right — properties (desktop) */}
        <aside className="hidden w-80 shrink-0 flex-col overflow-y-auto border-l border-line-dark thin-scroll lg:flex">
          <StudioPropertiesPanel
            activeStep={activeStep}
            design={design}
            dispatch={dispatch}
            fileInputRef={fileInputRef}
            handleFiles={handleFiles}
            dragActive={dragActive}
            setDragActive={setDragActive}
            activeLayer={activeLayer}
            setScale={setScale}
            setRotation={setRotation}
            material={material}
            weave={weave}
            border={border}
            zari={zari}
            checks={checks}
            status={status}
            versions={versions}
            onRestoreVersion={handleRestoreVersion}
            compareIds={compareIds}
            setCompareIds={setCompareIds}
          />
        </aside>
      </div>

      {/* Mobile bottom sheet */}
      {mobilePanelOpen && (
        <div className="fixed inset-x-0 bottom-0 z-40 max-h-[70vh] overflow-y-auto border-t border-line-dark bg-charcoal thin-scroll lg:hidden">
          <div className="flex items-center justify-between border-b border-line-dark px-4 py-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.15em] text-stone">
              {steps.find((s) => s.id === activeStep)?.label}
            </span>
            <button
              onClick={() => setMobilePanelOpen(false)}
              className="font-mono text-[11px] uppercase tracking-[0.15em] text-stone-light"
              aria-label="Close panel"
            >
              Close
            </button>
          </div>
          <StudioPropertiesPanel
            activeStep={activeStep}
            design={design}
            dispatch={dispatch}
            fileInputRef={fileInputRef}
            handleFiles={handleFiles}
            dragActive={dragActive}
            setDragActive={setDragActive}
            activeLayer={activeLayer}
            setScale={setScale}
            setRotation={setRotation}
            material={material}
            weave={weave}
            border={border}
            zari={zari}
            checks={checks}
            status={status}
            versions={versions}
            onRestoreVersion={handleRestoreVersion}
            compareIds={compareIds}
            setCompareIds={setCompareIds}
          />
        </div>
      )}

      {/* Bottom bar */}
      <div className="flex h-11 shrink-0 items-center justify-between border-t border-line-dark px-4 font-mono text-[10px] uppercase tracking-[0.15em] text-stone md:px-6">
        <div className="hidden items-center gap-6 md:flex">
          <span>Status: {status}</span>
          <span>Material: {material.name}</span>
        </div>
        <StatusBadge
          status={status === "ready" ? "pass" : status === "review" ? "warning" : "fail"}
        />
        <div className="hidden items-center gap-6 md:flex">
          <span>Repeat: {design.repeat.type}</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------

function StudioPropertiesPanel({
  activeStep,
  design,
  dispatch,
  fileInputRef,
  handleFiles,
  dragActive,
  setDragActive,
  activeLayer,
  setScale,
  setRotation,
  material,
  weave,
  border,
  zari,
  checks,
  status,
  versions,
  onRestoreVersion,
  compareIds,
  setCompareIds,
}: {
  activeStep: StudioStep;
  design: SareeDesign;
  dispatch: (action: DesignAction) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFiles: (files: FileList | null) => void;
  dragActive: boolean;
  setDragActive: (v: boolean) => void;
  activeLayer: ArtworkLayer | undefined;
  setScale: (scale: number) => void;
  setRotation: (rotation: number) => void;
  material: (typeof materials)[number];
  weave: (typeof weaves)[number];
  border: (typeof borders)[number];
  zari: (typeof zariOptions)[number];
  checks: ManufacturabilityCheck[];
  status: "ready" | "review" | "blocked";
  versions: DesignVersion[];
  onRestoreVersion: (v: DesignVersion) => void;
  compareIds: [string, string] | null;
  setCompareIds: (ids: [string, string] | null) => void;
}) {
  function toggleCompare(id: string) {
    if (!compareIds) {
      setCompareIds([id, id]);
      return;
    }
    const [first] = compareIds;
    if (first === id) {
      setCompareIds(null);
      return;
    }
    setCompareIds([first, id]);
  }
  return (
    <>
      <div className="border-b border-line-dark p-5">
        <p className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-stone lg:block">
          {steps.find((s) => s.id === activeStep)?.label}
        </p>

        {activeStep === "material" && (
          <div className="mt-4 flex flex-col gap-2">
            {materials.map((m) => (
              <button
                key={m.id}
                onClick={() => dispatch({ type: "SET_MATERIAL", materialId: m.id })}
                className={`border px-4 py-3 text-left transition-colors ${
                  m.id === design.materialId
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

            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-stone">
              Weave
            </p>
            <div className="flex flex-col gap-2">
              {weavesForMaterial(design.materialId).map((w) => (
                <button
                  key={w.id}
                  onClick={() => dispatch({ type: "SET_WEAVE", weaveId: w.id })}
                  className={`border px-4 py-3 text-left transition-colors ${
                    w.id === design.weaveId
                      ? "border-brass-bright bg-charcoal-soft"
                      : "border-line-dark hover:border-stone"
                  }`}
                >
                  <span className="block font-display text-base">{w.name}</span>
                  <span className="mt-1 block font-mono text-[10px] leading-relaxed text-stone">
                    {w.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeStep === "colour" && (
          <div className="mt-4 flex flex-col gap-3">
            {(["base", "motif", "border", "pallu", "accent", "blouse"] as const).map((slot) => (
              <label
                key={slot}
                className="flex items-center justify-between border border-line-dark px-4 py-3"
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-stone">
                  {slot}
                </span>
                <span className="flex items-center gap-2">
                  <input
                    type="color"
                    value={design.paletteHexBySlot[slot]}
                    onChange={(e) =>
                      dispatch({ type: "SET_COLOUR", slot, hex: e.target.value })
                    }
                    className="h-6 w-6 cursor-pointer border border-line-dark bg-transparent p-0"
                    aria-label={`${slot} colour`}
                  />
                  <span className="font-mono text-[10px] text-stone">
                    {design.paletteHexBySlot[slot]}
                  </span>
                </span>
              </label>
            ))}
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-stone">
              Screen colour is not an exact physical colour match. Request a swatch
              to confirm.
            </p>
          </div>
        )}

        {activeStep === "artwork" && (
          <div className="mt-4 flex flex-col gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />

            {design.artwork.status === "empty" && (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  handleFiles(e.dataTransfer.files);
                }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 border-2 border-dashed px-4 py-10 text-center transition-colors ${
                  dragActive ? "border-brass-bright bg-charcoal-soft" : "border-brass/60 hover:border-brass-bright hover:bg-charcoal-soft"
                }`}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M12 16V4m0 0L7 9m5-5l5 5M5 20h14"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-brass-bright"
                  />
                </svg>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="bg-brass-bright px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-charcoal hover:bg-ivory"
                >
                  Upload Image
                </button>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone-light">
                  or drop artwork here
                </span>
                <span className="font-mono text-[9px] text-stone">PNG · JPG · SVG, up to 8 MB</span>
              </div>
            )}

            {(design.artwork.status === "uploading" || design.artwork.status === "processing") && (
              <div className="border border-line-dark px-4 py-8 text-center">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-brass-bright">
                  Preparing artwork
                </p>
                <p className="mt-2 font-mono text-[10px] text-stone">Reading file…</p>
              </div>
            )}

            {design.artwork.status === "error" && (
              <div className="border border-danger/40 bg-danger/10 px-4 py-4">
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-danger">
                  Upload failed
                </p>
                <p className="mt-2 text-xs text-stone-light">{design.artwork.error}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3 border border-line-dark px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-stone-light hover:border-brass hover:text-brass"
                >
                  Try again
                </button>
              </div>
            )}

            {design.artwork.layers.length > 0 && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone">
                  Layers
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {design.artwork.layers.map((l) => (
                    <li
                      key={l.id}
                      className={`flex items-center justify-between border px-3 py-2 text-xs ${
                        l.id === design.artwork.activeLayerId
                          ? "border-brass-bright bg-charcoal-soft"
                          : "border-line-dark"
                      }`}
                    >
                      <button
                        onClick={() => dispatch({ type: "ARTWORK_SET_ACTIVE", layerId: l.id })}
                        className="flex-1 truncate text-left text-stone-light"
                      >
                        {l.name}
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => dispatch({ type: "ARTWORK_TOGGLE_VISIBLE", layerId: l.id })}
                          className="text-stone hover:text-brass"
                          aria-label={l.visible ? "Hide layer" : "Show layer"}
                        >
                          {l.visible ? "On" : "Off"}
                        </button>
                        <button
                          onClick={() => dispatch({ type: "ARTWORK_REMOVE", layerId: l.id })}
                          className="text-stone hover:text-danger"
                          aria-label="Delete layer"
                        >
                          ×
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 w-full border border-line-dark py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-stone-light hover:border-brass hover:text-brass"
                >
                  Add another layer
                </button>
              </div>
            )}

            {activeLayer && (
              <div className="flex flex-col gap-4 border-t border-line-dark pt-4">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone">
                    Place on
                  </span>
                  <div className="mt-2 flex gap-2">
                    {(["body", "border", "pallu"] as const).map((region) => (
                      <button
                        key={region}
                        onClick={() =>
                          dispatch({ type: "ARTWORK_SET_PLACEMENT", layerId: activeLayer.id, placement: region })
                        }
                        className={`flex-1 border py-1.5 font-mono text-[10px] capitalize ${
                          (activeLayer.placement ?? "body") === region
                            ? "border-brass-bright text-brass-bright"
                            : "border-line-dark text-stone-light"
                        }`}
                      >
                        {region}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone">
                    Scale — {Math.round(activeLayer.transform.scale * 100)}%
                  </span>
                  <input
                    type="range"
                    min={25}
                    max={300}
                    value={Math.round(activeLayer.transform.scale * 100)}
                    onChange={(e) => setScale(Number(e.target.value) / 100)}
                    className="mt-2 w-full accent-brass-bright"
                  />
                </div>
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone">
                    Rotation — {activeLayer.transform.rotation}°
                  </span>
                  <div className="mt-2 flex gap-2">
                    {[0, 45, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        onClick={() => setRotation(deg)}
                        className={`flex-1 border py-1.5 font-mono text-[10px] ${
                          activeLayer.transform.rotation === deg
                            ? "border-brass-bright text-brass-bright"
                            : "border-line-dark text-stone-light"
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>
                <p className="font-mono text-[9px] text-stone">Drag the artwork on the canvas to reposition it.</p>
              </div>
            )}

            <p className="font-mono text-[10px] leading-relaxed text-stone">
              I confirm I have the right to use this artwork for this project.
            </p>
          </div>
        )}

        {activeStep === "repeat" && (
          <div className="mt-4 flex flex-col gap-4">
            {(["straight", "half-drop", "mirror", "brick"] as const).map((r) => (
              <label key={r} className="flex items-center gap-3 font-mono text-xs capitalize">
                <input
                  type="radio"
                  name="repeat"
                  checked={design.repeat.type === r}
                  onChange={() => dispatch({ type: "SET_REPEAT_TYPE", repeatType: r })}
                />
                {r.replace("-", " ")} repeat
              </label>
            ))}
            <div>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-stone">
                Repeat width — {design.repeat.widthCm} cm
              </span>
              <input
                type="range"
                min={4}
                max={44}
                value={design.repeat.widthCm}
                onChange={(e) =>
                  dispatch({
                    type: "SET_REPEAT_SIZE",
                    widthCm: Number(e.target.value),
                    heightCm: design.repeat.heightCm,
                  })
                }
                className="mt-2 w-full accent-brass-bright"
              />
            </div>
          </div>
        )}

        {activeStep === "border" && (
          <div className="mt-4 flex flex-col gap-2">
            {borders.map((b) => (
              <button
                key={b.id}
                onClick={() => dispatch({ type: "SET_BORDER", borderId: b.id })}
                className={`flex items-center justify-between border px-4 py-3 text-left transition-colors ${
                  b.id === design.borderId
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
                onClick={() => dispatch({ type: "SET_PALLU", palluId: p.id })}
                className={`border px-4 py-3 text-left font-display text-base transition-colors ${
                  p.id === design.palluId
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
                onClick={() => dispatch({ type: "SET_ZARI", zariId: z.id })}
                className={`flex items-center justify-between border px-4 py-3 text-left transition-colors ${
                  z.id === design.zariId
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
          Technical specification
        </p>
        <dl className="mt-4 flex flex-col gap-2 font-mono text-[11px]">
          {[
            ["Material", material.name],
            ["Weave", weave.name],
            ["Width", material.width],
            ["Weight", material.weight],
            ["Repeat", `${design.repeat.widthCm} × ${design.repeat.heightCm} cm, ${design.repeat.type}`],
            ["Border", `${border.widthCm} cm · ${border.name}`],
            ["Zari", zari.name],
            ["Artwork layers", `${design.artwork.layers.length}`],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between">
              <dt className="text-stone">{k}</dt>
              <dd className="text-right">{v}</dd>
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
          <StatusBadge
            status={status === "ready" ? "pass" : status === "review" ? "warning" : "fail"}
          />
        </div>
        <ul className="mt-4 flex flex-col gap-2.5">
          {checks.map((c) => (
            <li key={c.label} className="flex flex-col gap-1 text-xs">
              <div className="flex items-start justify-between gap-3">
                <span className="text-stone-light">{c.label}</span>
                <StatusBadge
                  status={c.status === "ready" ? "pass" : c.status === "review" ? "warning" : "fail"}
                />
              </div>
              {c.note && <p className="font-mono text-[10px] text-stone">{c.note}</p>}
            </li>
          ))}
        </ul>
      </div>

      {/* Live pricing is intentionally not shown here — see the note above
          the pricing-engine import in this file. */}

      {/* Version history */}
      {versions.length > 0 && (
        <div className="p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-stone">
              Version history
            </p>
            {compareIds && (
              <button
                onClick={() => setCompareIds(null)}
                className="font-mono text-[9px] uppercase tracking-[0.1em] text-stone hover:text-brass"
              >
                Clear compare
              </button>
            )}
          </div>
          <ul className="mt-4 flex flex-col gap-2">
            {[...versions].reverse().map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-stone-light">{v.label}</span>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => toggleCompare(v.id)}
                    className={`border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] ${
                      compareIds?.includes(v.id)
                        ? "border-brass-bright text-brass-bright"
                        : "border-line-dark text-stone hover:border-brass hover:text-brass"
                    }`}
                  >
                    Compare
                  </button>
                  <button
                    onClick={() => onRestoreVersion(v)}
                    className="border border-line-dark px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-stone hover:border-brass hover:text-brass"
                  >
                    Restore
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {compareIds && compareIds[0] !== compareIds[1] && (
            <VersionCompareTable
              versions={versions}
              ids={compareIds}
              onRestore={onRestoreVersion}
            />
          )}
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

function VersionCompareTable({
  versions,
  ids,
  onRestore,
}: {
  versions: DesignVersion[];
  ids: [string, string];
  onRestore: (v: DesignVersion) => void;
}) {
  const a = versions.find((v) => v.id === ids[0]);
  const b = versions.find((v) => v.id === ids[1]);
  if (!a || !b) return null;

  const rows = diffDesigns(a.design, b.design);

  return (
    <div className="mt-4 border border-line-dark">
      <div className="grid grid-cols-[1fr_1fr_1fr] gap-2 border-b border-line-dark bg-charcoal-soft px-3 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-stone">
        <span>Field</span>
        <span className="truncate text-stone-light" title={a.label}>
          {a.label}
        </span>
        <span className="truncate text-stone-light" title={b.label}>
          {b.label}
        </span>
      </div>
      <ul>
        {rows.map((r) => (
          <li
            key={r.label}
            className={`grid grid-cols-[1fr_1fr_1fr] gap-2 border-b border-line-dark px-3 py-2 font-mono text-[10px] last:border-b-0 ${
              r.changed ? "bg-brass/10" : ""
            }`}
          >
            <span className="text-stone">{r.label}</span>
            <span className={r.changed ? "text-brass-bright" : "text-stone-light"}>{r.a}</span>
            <span className={r.changed ? "text-brass-bright" : "text-stone-light"}>{r.b}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-end gap-2 p-2">
        <button
          onClick={() => onRestore(a)}
          className="border border-line-dark px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-stone hover:border-brass hover:text-brass"
        >
          Restore {a.label.split(" — ")[0]}
        </button>
        <button
          onClick={() => onRestore(b)}
          className="border border-line-dark px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-stone hover:border-brass hover:text-brass"
        >
          Restore {b.label.split(" — ")[0]}
        </button>
      </div>
    </div>
  );
}
