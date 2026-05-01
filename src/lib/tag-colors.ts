"use client";

import { useCallback, useEffect, useState } from "react";

export interface TagColor {
  name: string;
  bg: string;
  text: string;
  border: string;
  activeBg: string;
  activeText: string;
  activeBorder: string;
}

export const TAG_COLORS: TagColor[] = [
  { name: "gray",   bg: "bg-gray-100 dark:bg-gray-800",       text: "text-gray-700 dark:text-gray-200",     border: "border-gray-200 dark:border-gray-700",     activeBg: "bg-gray-600 dark:bg-gray-400",     activeText: "text-white dark:text-gray-950",     activeBorder: "border-gray-700 dark:border-gray-300" },
  { name: "red",    bg: "bg-red-100 dark:bg-red-950",         text: "text-red-700 dark:text-red-300",       border: "border-red-200 dark:border-red-900",       activeBg: "bg-red-600 dark:bg-red-500",       activeText: "text-white",                        activeBorder: "border-red-700 dark:border-red-400" },
  { name: "orange", bg: "bg-orange-100 dark:bg-orange-950",   text: "text-orange-700 dark:text-orange-300", border: "border-orange-200 dark:border-orange-900", activeBg: "bg-orange-600 dark:bg-orange-500", activeText: "text-white",                        activeBorder: "border-orange-700 dark:border-orange-400" },
  { name: "yellow", bg: "bg-yellow-100 dark:bg-yellow-950",   text: "text-yellow-700 dark:text-yellow-300", border: "border-yellow-200 dark:border-yellow-900", activeBg: "bg-yellow-500 dark:bg-yellow-500", activeText: "text-white dark:text-yellow-950",   activeBorder: "border-yellow-600 dark:border-yellow-400" },
  { name: "green",  bg: "bg-green-100 dark:bg-green-950",     text: "text-green-700 dark:text-green-300",   border: "border-green-200 dark:border-green-900",   activeBg: "bg-green-600 dark:bg-green-500",   activeText: "text-white",                        activeBorder: "border-green-700 dark:border-green-400" },
  { name: "teal",   bg: "bg-teal-100 dark:bg-teal-950",       text: "text-teal-700 dark:text-teal-300",     border: "border-teal-200 dark:border-teal-900",     activeBg: "bg-teal-600 dark:bg-teal-500",     activeText: "text-white",                        activeBorder: "border-teal-700 dark:border-teal-400" },
  { name: "blue",   bg: "bg-blue-100 dark:bg-blue-950",       text: "text-blue-700 dark:text-blue-300",     border: "border-blue-200 dark:border-blue-900",     activeBg: "bg-blue-600 dark:bg-blue-500",     activeText: "text-white",                        activeBorder: "border-blue-700 dark:border-blue-400" },
  { name: "indigo", bg: "bg-indigo-100 dark:bg-indigo-950",   text: "text-indigo-700 dark:text-indigo-300", border: "border-indigo-200 dark:border-indigo-900", activeBg: "bg-indigo-600 dark:bg-indigo-500", activeText: "text-white",                        activeBorder: "border-indigo-700 dark:border-indigo-400" },
  { name: "purple", bg: "bg-purple-100 dark:bg-purple-950",   text: "text-purple-700 dark:text-purple-300", border: "border-purple-200 dark:border-purple-900", activeBg: "bg-purple-600 dark:bg-purple-500", activeText: "text-white",                        activeBorder: "border-purple-700 dark:border-purple-400" },
  { name: "pink",   bg: "bg-pink-100 dark:bg-pink-950",       text: "text-pink-700 dark:text-pink-300",     border: "border-pink-200 dark:border-pink-900",     activeBg: "bg-pink-600 dark:bg-pink-500",     activeText: "text-white",                        activeBorder: "border-pink-700 dark:border-pink-400" },
];

// O(1) optimized lookup map for constant tag color data
const TAG_COLORS_MAP = new Map(TAG_COLORS.map(c => [c.name, c]));

const STORAGE_KEY = "opencitation:tag-colors";
const CHANGE_EVENT = "opencitation:tag-colors-changed";

function hashColor(tag: string): TagColor {
  const hash = tag.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return TAG_COLORS[hash % TAG_COLORS.length];
}

function readMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore quota / disabled storage
  }
}

export function resolveTagColor(tag: string, map: Record<string, string>): TagColor {
  const named = map[tag];
  if (named) {
    // ⚡ Bolt: Replace O(N) array .find() with O(1) Map lookup
    const found = TAG_COLORS_MAP.get(named);
    if (found) return found;
  }
  return hashColor(tag);
}

export function useTagColors() {
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMap(readMap());
    const onChange = () => setMap(readMap());
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  const getColor = useCallback((tag: string) => resolveTagColor(tag, map), [map]);

  const setColor = useCallback((tag: string, colorName: string) => {
    setMap((prev) => {
      const next = { ...prev, [tag]: colorName };
      writeMap(next);
      return next;
    });
  }, []);

  const clearColor = useCallback((tag: string) => {
    setMap((prev) => {
      if (!(tag in prev)) return prev;
      const next = { ...prev };
      delete next[tag];
      writeMap(next);
      return next;
    });
  }, []);

  return { getColor, setColor, clearColor };
}
