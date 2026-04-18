"use client";

import { useCallback, useEffect, useState } from "react";

export interface TagColor {
  name: string;
  bg: string;
  text: string;
  border: string;
}

export const TAG_COLORS: TagColor[] = [
  { name: "gray",   bg: "bg-gray-100",   text: "text-gray-700",   border: "border-gray-200" },
  { name: "red",    bg: "bg-red-100",    text: "text-red-700",    border: "border-red-200" },
  { name: "orange", bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  { name: "yellow", bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  { name: "green",  bg: "bg-green-100",  text: "text-green-700",  border: "border-green-200" },
  { name: "teal",   bg: "bg-teal-100",   text: "text-teal-700",   border: "border-teal-200" },
  { name: "blue",   bg: "bg-blue-100",   text: "text-blue-700",   border: "border-blue-200" },
  { name: "indigo", bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200" },
  { name: "purple", bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  { name: "pink",   bg: "bg-pink-100",   text: "text-pink-700",   border: "border-pink-200" },
];

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
    const found = TAG_COLORS.find((c) => c.name === named);
    if (found) return found;
  }
  return hashColor(tag);
}

export function useTagColors() {
  const [map, setMap] = useState<Record<string, string>>({});

  useEffect(() => {
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
