"use client";

import { useEffect, useState } from "react";

export interface Milestone {
  count: number;
  title: string;
  blurb: string;
}

export const MILESTONES: Milestone[] = [
  { count: 1,    title: "First Citation Barnstar",    blurb: "Your first saved citation — welcome to the stacks." },
  { count: 5,    title: "Five-Cite Barnstar",         blurb: "A small shelf forms." },
  { count: 10,   title: "Tenth-Cite Barnstar",        blurb: "Ten down, a lifetime to go." },
  { count: 25,   title: "Quarter-Ton Barnstar",       blurb: "Twenty-five citations. A proper bibliography." },
  { count: 50,   title: "Half-Century Barnstar",      blurb: "Fifty references. You're cooking." },
  { count: 100,  title: "Centurion Barnstar",         blurb: "One hundred citations saved." },
  { count: 250,  title: "Quarter-Thousand Barnstar",  blurb: "A research veteran." },
  { count: 500,  title: "Bibliography Barnstar",      blurb: "Half a thousand. Librarian energy." },
  { count: 1000, title: "Scholar Supreme Barnstar",   blurb: "A full thousand. Legendary." },
];

const STORAGE_KEY = "opencitation:barnstars";
const AWARD_EVENT = "opencitation:barnstar-awarded";

interface BarnstarState {
  total: number;
  awarded: number[];
}

function readState(): BarnstarState {
  if (typeof window === "undefined") return { total: 0, awarded: [] };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { total: 0, awarded: [] };
    const parsed = JSON.parse(raw);
    return {
      total: typeof parsed.total === "number" ? parsed.total : 0,
      awarded: Array.isArray(parsed.awarded) ? parsed.awarded : [],
    };
  } catch {
    return { total: 0, awarded: [] };
  }
}

function writeState(state: BarnstarState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function recordCitationSave(): void {
  if (typeof window === "undefined") return;
  const state = readState();
  const newTotal = state.total + 1;
  const newlyCrossed = MILESTONES.filter(
    (m) => m.count <= newTotal && !state.awarded.includes(m.count)
  );
  const toAward = newlyCrossed[newlyCrossed.length - 1];
  const nextAwarded = toAward
    ? Array.from(new Set([...state.awarded, ...newlyCrossed.map((m) => m.count)]))
    : state.awarded;
  writeState({ total: newTotal, awarded: nextAwarded });
  if (toAward) {
    window.dispatchEvent(new CustomEvent(AWARD_EVENT, { detail: toAward }));
  }
}

export function useBarnstarAward() {
  const [award, setAward] = useState<Milestone | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Milestone>).detail;
      if (detail) setAward(detail);
    };
    window.addEventListener(AWARD_EVENT, handler);
    return () => window.removeEventListener(AWARD_EVENT, handler);
  }, []);

  return { award, dismiss: () => setAward(null) };
}
