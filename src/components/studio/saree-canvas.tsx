"use client";

import { useCallback, useRef, useState } from "react";
import {
  type Composition,
  type CompositionObject,
  moveObject,
  rotateObject,
  scaleObject,
  SCALE_MAX,
  SCALE_MIN,
} from "@/domain/composition";

/**
 * The compose canvas (§9.3, §10.2).
 *
 * Deliberately not a general image editor (§9.5, §13): an object can be moved,
 * resized, rotated and deleted — nothing else. There are no layers, masks,
 * blend modes or vector tools.
 *
 * Everything is stored in the normalized 0..1 space, so the canvas can be any
 * size on screen and the composition means the same thing to the renderer, the
 * generation pipeline and the loom.
 */

type Gesture =
  | { kind: "move"; objectId: string; grabDx: number; grabDy: number }
  | { kind: "scale"; objectId: string; startDistance: number; startScale: number }
  | { kind: "rotate"; objectId: string; startAngle: number; startRotation: number };

export interface SareeCanvasProps {
  composition: Composition;
  backgroundUrl: string | null;
  selectedId: string | null;
  imageUrlFor: (assetId: string) => string | null;
  onSelect: (objectId: string | null) => void;
  onChange: (next: Composition, gestureId: string) => void;
  onDelete: (objectId: string) => void;
  disabled?: boolean;
}

export function SareeCanvas({
  composition,
  backgroundUrl,
  selectedId,
  imageUrlFor,
  onSelect,
  onChange,
  onDelete,
  disabled = false,
}: SareeCanvasProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const gestureIdRef = useRef<string>("");
  // A counter rather than a timestamp: it only needs to be unique per gesture,
  // and reading the clock during a render pass is not permitted.
  const gestureSeqRef = useRef(0);
  const [activeId, setActiveId] = useState<string | null>(null);

  /** Converts a client point into the canvas's normalized 0..1 space. */
  const toNormalized = useCallback((clientX: number, clientY: number) => {
    const frame = frameRef.current;
    if (!frame) return { x: 0.5, y: 0.5 };
    const rect = frame.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }, []);

  const endGesture = useCallback(() => {
    gestureRef.current = null;
    setActiveId(null);
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      const gesture = gestureRef.current;
      if (!gesture || disabled) return;

      const object = composition.objects.find((entry) => entry.id === gesture.objectId);
      if (!object) return;

      const point = toNormalized(event.clientX, event.clientY);
      const frame = frameRef.current;
      if (!frame) return;

      if (gesture.kind === "move") {
        onChange(
          moveObject(composition, object.id, point.x - gesture.grabDx, point.y - gesture.grabDy),
          gestureIdRef.current,
        );
        return;
      }

      // Scale and rotate both measure from the object's centre on screen.
      const rect = frame.getBoundingClientRect();
      const centreX = rect.left + object.x * rect.width;
      const centreY = rect.top + object.y * rect.height;
      const dx = event.clientX - centreX;
      const dy = event.clientY - centreY;

      if (gesture.kind === "scale") {
        const distance = Math.hypot(dx, dy);
        if (gesture.startDistance === 0) return;
        const ratio = distance / gesture.startDistance;
        const next = Math.min(SCALE_MAX, Math.max(SCALE_MIN, gesture.startScale * ratio));
        onChange(scaleObject(composition, object.id, next), gestureIdRef.current);
        return;
      }

      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const delta = angle - gesture.startAngle;
      onChange(
        rotateObject(composition, object.id, gesture.startRotation + delta),
        gestureIdRef.current,
      );
    },
    [composition, disabled, onChange, toNormalized],
  );

  const beginMove = (event: React.PointerEvent, object: CompositionObject) => {
    if (disabled || object.locked) return;
    event.stopPropagation();
    (event.target as Element).setPointerCapture?.(event.pointerId);

    const point = toNormalized(event.clientX, event.clientY);
    gestureSeqRef.current += 1;
    gestureIdRef.current = `move:${object.id}:${gestureSeqRef.current}`;
    gestureRef.current = {
      kind: "move",
      objectId: object.id,
      grabDx: point.x - object.x,
      grabDy: point.y - object.y,
    };
    setActiveId(object.id);
    onSelect(object.id);
  };

  const beginHandle = (
    event: React.PointerEvent,
    object: CompositionObject,
    kind: "scale" | "rotate",
  ) => {
    if (disabled || object.locked) return;
    event.stopPropagation();
    (event.target as Element).setPointerCapture?.(event.pointerId);

    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const centreX = rect.left + object.x * rect.width;
    const centreY = rect.top + object.y * rect.height;
    const dx = event.clientX - centreX;
    const dy = event.clientY - centreY;

    gestureSeqRef.current += 1;
    gestureIdRef.current = `${kind}:${object.id}:${gestureSeqRef.current}`;
    gestureRef.current =
      kind === "scale"
        ? {
            kind: "scale",
            objectId: object.id,
            startDistance: Math.hypot(dx, dy),
            startScale: object.scale,
          }
        : {
            kind: "rotate",
            objectId: object.id,
            startAngle: (Math.atan2(dy, dx) * 180) / Math.PI,
            startRotation: object.rotation,
          };
    setActiveId(object.id);
    onSelect(object.id);
  };

  /**
   * Keyboard equivalents (§41). A canvas is hard for assistive technology, so
   * every pointer gesture has a key: arrows move, +/- scale, [/] rotate,
   * Delete removes.
   */
  const handleKeyDown = (event: React.KeyboardEvent, object: CompositionObject) => {
    if (disabled || object.locked) return;
    const step = event.shiftKey ? 0.1 : 0.02;
    const gestureId = `key:${object.id}`;

    switch (event.key) {
      case "ArrowLeft":
        onChange(moveObject(composition, object.id, object.x - step, object.y), gestureId);
        break;
      case "ArrowRight":
        onChange(moveObject(composition, object.id, object.x + step, object.y), gestureId);
        break;
      case "ArrowUp":
        onChange(moveObject(composition, object.id, object.x, object.y - step), gestureId);
        break;
      case "ArrowDown":
        onChange(moveObject(composition, object.id, object.x, object.y + step), gestureId);
        break;
      case "+":
      case "=":
        onChange(scaleObject(composition, object.id, object.scale + 0.1), gestureId);
        break;
      case "-":
        onChange(scaleObject(composition, object.id, object.scale - 0.1), gestureId);
        break;
      case "[":
        onChange(rotateObject(composition, object.id, object.rotation - 5), gestureId);
        break;
      case "]":
        onChange(rotateObject(composition, object.id, object.rotation + 5), gestureId);
        break;
      case "Delete":
      case "Backspace":
        onDelete(object.id);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const ordered = [...composition.objects].sort((a, b) => a.zIndex - b.zIndex);

  return (
    <div
      ref={frameRef}
      onPointerMove={handlePointerMove}
      onPointerUp={endGesture}
      onPointerCancel={endGesture}
      onPointerDown={() => onSelect(null)}
      className="relative aspect-[2/3] w-full touch-none select-none overflow-hidden rounded-sm border border-line bg-paper-dim"
    >
      {backgroundUrl ? (
        // The customer's own photograph, served from a signed URL.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={backgroundUrl}
          alt="Your saree"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-xs text-gray">
          Upload a saree photo to begin.
        </div>
      )}

      {ordered.map((object) => {
        const isSelected = object.id === selectedId;
        const isActive = object.id === activeId;
        const widthPercent = object.boundingBox.width * object.scale * 100;
        const heightPercent = object.boundingBox.height * object.scale * 100;

        return (
          <div
            key={object.id}
            role="button"
            tabIndex={0}
            aria-label={
              object.type === "text"
                ? `Text: ${object.text}. Arrow keys move, plus and minus resize, brackets rotate, Delete removes.`
                : "Your image. Arrow keys move, plus and minus resize, brackets rotate, Delete removes."
            }
            onPointerDown={(event) => beginMove(event, object)}
            onKeyDown={(event) => handleKeyDown(event, object)}
            onFocus={() => onSelect(object.id)}
            style={{
              position: "absolute",
              left: `${object.x * 100}%`,
              top: `${object.y * 100}%`,
              width: `${widthPercent}%`,
              height: `${heightPercent}%`,
              transform: `translate(-50%, -50%) rotate(${object.rotation}deg)`,
              opacity: object.opacity,
              cursor: disabled ? "default" : isActive ? "grabbing" : "grab",
            }}
            className={[
              "grid place-items-center outline-none",
              isSelected ? "ring-2 ring-paper" : "",
              "focus-visible:ring-2 focus-visible:ring-paper",
            ].join(" ")}
          >
            {object.type === "image" ? (
              imageUrlFor(object.assetId) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrlFor(object.assetId)!}
                  alt=""
                  className="pointer-events-none h-full w-full object-contain"
                  draggable={false}
                />
              ) : (
                <span className="pointer-events-none rounded-sm bg-ink/60 px-2 py-1 text-[10px] text-paper">
                  Image
                </span>
              )
            ) : (
              <span
                className="pointer-events-none whitespace-pre text-center font-display leading-none text-paper drop-shadow"
                style={{ fontSize: `calc(${heightPercent}px * 0.6)` }}
              >
                {object.text}
              </span>
            )}

            {isSelected && !disabled && (
              <>
                {/* Resize — bottom-right. */}
                <span
                  role="slider"
                  tabIndex={-1}
                  aria-label="Resize"
                  aria-valuenow={Math.round(object.scale * 100)}
                  aria-valuemin={Math.round(SCALE_MIN * 100)}
                  aria-valuemax={Math.round(SCALE_MAX * 100)}
                  onPointerDown={(event) => beginHandle(event, object, "scale")}
                  className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-full border border-ink bg-paper"
                />
                {/* Rotate — top-centre, the conventional position. */}
                <span
                  role="slider"
                  tabIndex={-1}
                  aria-label="Rotate"
                  aria-valuenow={Math.round(object.rotation)}
                  aria-valuemin={0}
                  aria-valuemax={359}
                  onPointerDown={(event) => beginHandle(event, object, "rotate")}
                  className="absolute -top-6 left-1/2 h-4 w-4 -translate-x-1/2 cursor-grab rounded-full border border-ink bg-paper"
                />
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
