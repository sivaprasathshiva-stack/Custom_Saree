import type { DesignVersion, SareeDesign } from "./types";

/**
 * Local-only persistence. This is explicitly NOT server-side persistence —
 * it exists so "Save" and version history are real and usable within a
 * browser session/device, structured so a future API-backed store can
 * implement the same three functions and swap in without touching the UI.
 */
const CURRENT_KEY = "sari-studio:current-design";
const VERSIONS_KEY = "sari-studio:design-versions";

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadCurrentDesign(): SareeDesign | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(CURRENT_KEY);
    return raw ? (JSON.parse(raw) as SareeDesign) : null;
  } catch {
    return null;
  }
}

export function saveCurrentDesign(design: SareeDesign): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(CURRENT_KEY, JSON.stringify(design));
    return true;
  } catch {
    return false;
  }
}

export function loadVersions(): DesignVersion[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(VERSIONS_KEY);
    return raw ? (JSON.parse(raw) as DesignVersion[]) : [];
  } catch {
    return [];
  }
}

export function saveVersions(versions: DesignVersion[]): boolean {
  if (!isBrowser()) return false;
  try {
    window.localStorage.setItem(VERSIONS_KEY, JSON.stringify(versions));
    return true;
  } catch {
    return false;
  }
}
