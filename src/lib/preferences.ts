import type { SourceType, AccessType } from "@/types";

/**
 * Device-local user preferences, persisted in localStorage.
 * (Theme has its own key, `opencitation-theme`, read pre-hydration.)
 */

export interface Preferences {
  /** Built-in style id ("apa", …) or a CSL style id ("ieee", …). */
  defaultStyle: string;
  defaultSourceType: SourceType;
  defaultAccessType: AccessType;
}

export const PREFERENCES_KEY = "opencitation-prefs";

export const DEFAULT_PREFERENCES: Preferences = {
  defaultStyle: "apa",
  defaultSourceType: "website",
  defaultAccessType: "web",
};

export function getPreferences(): Preferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(update: Partial<Preferences>): Preferences {
  const next = { ...getPreferences(), ...update };
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
  } catch {
    // Storage full or unavailable — preferences just won't persist.
  }
  return next;
}
