"use client";

import { useState, useEffect, useRef } from "react";
import { WikiLayout } from "@/components/wiki/wiki-layout";
import { WikiBreadcrumbs } from "@/components/wiki/wiki-breadcrumbs";
import { WikiButton } from "@/components/wiki/wiki-button";
import { WikiSelect } from "@/components/wiki/wiki-select";
import { CSL_STYLES } from "@/lib/citation";
import { SOURCE_TYPES, CITATION_STYLES, ACCESS_TYPES } from "@/lib/citation-options";
import {
  getPreferences,
  savePreferences,
  DEFAULT_PREFERENCES,
  type Preferences,
} from "@/lib/preferences";

const STYLE_OPTIONS = [
  ...CITATION_STYLES.map((s) => ({ value: s.value as string, label: s.label })),
  ...CSL_STYLES.map((s) => ({ value: s.id, label: s.label })),
];

export default function SettingsPage() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefs(getPreferences());
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    setMounted(true);
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    };
  }, []);

  const flashSaved = () => {
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    setSavedFlash(true);
    flashTimerRef.current = setTimeout(() => setSavedFlash(false), 1500);
  };

  const update = (change: Partial<Preferences>) => {
    setPrefs(savePreferences(change));
    flashSaved();
  };

  const applyTheme = (next: "light" | "dark") => {
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("opencitation-theme", next);
    flashSaved();
  };

  return (
    <WikiLayout>
      <WikiBreadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Settings" }]}
      />

      <div className="mt-6">
        <div className="border border-wiki-border-light bg-wiki-white p-6 md:p-8">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-2xl font-bold">Settings</h1>
            <span
              role="status"
              className={`text-sm text-wiki-text-muted ${savedFlash ? "" : "invisible"}`}
            >
              Saved
            </span>
          </div>
          <p className="text-wiki-text-muted text-sm mb-6">
            Preferences are saved automatically and stored on this device.
          </p>

          {mounted && (
            <div className="space-y-8">
              <section>
                <h2 className="text-lg font-semibold mb-1">Citation Defaults</h2>
                <p className="text-sm text-wiki-text-muted mb-4">
                  Applied when you open the citation generator.
                </p>
                <div className="space-y-4 max-w-xs">
                  <div>
                    <span id="default-style-label" className="block text-sm font-medium mb-1">
                      Default citation style
                    </span>
                    <WikiSelect
                      aria-labelledby="default-style-label"
                      value={prefs.defaultStyle}
                      onChange={(v) => update({ defaultStyle: v })}
                      options={STYLE_OPTIONS}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <span id="default-source-type-label" className="block text-sm font-medium mb-1">
                      Default source type
                    </span>
                    <WikiSelect
                      aria-labelledby="default-source-type-label"
                      value={prefs.defaultSourceType}
                      onChange={(v) => update({ defaultSourceType: v as Preferences["defaultSourceType"] })}
                      options={SOURCE_TYPES}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <span id="default-access-type-label" className="block text-sm font-medium mb-1">
                      Default access type
                    </span>
                    <WikiSelect
                      aria-labelledby="default-access-type-label"
                      value={prefs.defaultAccessType}
                      onChange={(v) => update({ defaultAccessType: v as Preferences["defaultAccessType"] })}
                      options={ACCESS_TYPES}
                      className="w-full"
                    />
                  </div>
                </div>
              </section>

              <section className="pt-6 border-t border-wiki-border-light">
                <h2 className="text-lg font-semibold mb-1">Appearance</h2>
                <p className="text-sm text-wiki-text-muted mb-4">
                  Also available from the sun/moon toggle in the header.
                </p>
                <div className="flex gap-2">
                  <WikiButton
                    variant={theme === "light" ? "primary" : "default"}
                    className={theme === "light" ? "border-wiki-link" : ""}
                    onClick={() => applyTheme("light")}
                  >
                    Light
                  </WikiButton>
                  <WikiButton
                    variant={theme === "dark" ? "primary" : "default"}
                    className={theme === "dark" ? "border-wiki-link" : ""}
                    onClick={() => applyTheme("dark")}
                  >
                    Dark
                  </WikiButton>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </WikiLayout>
  );
}
