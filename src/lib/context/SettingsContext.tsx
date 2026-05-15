"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// ─── 타입 ───────────────────────────────────────────────────────────────────
export type ThemeMode = "light" | "dark" | "system";

export interface AppSettings {
  theme: ThemeMode;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
};

const STORAGE_KEY = "dongan-app-settings-v1";

interface SettingsContextValue {
  settings: AppSettings;
  hydrated: boolean;
  setTheme: (t: ThemeMode) => void;
  resetAll: () => void;
}

const Ctx = createContext<SettingsContextValue | null>(null);

// ─── 실제 다크 적용 여부 결정 ──────────────────────────────────────────────
function resolveDark(theme: ThemeMode): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolveDark(theme)) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

// ─── Provider ──────────────────────────────────────────────────────────────
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [hydrated, setHydrated] = useState(false);

  // 마운트 시 localStorage 에서 읽기
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppSettings>;
        const merged = { ...DEFAULT_SETTINGS, ...parsed };
        setSettings(merged);
        applyTheme(merged.theme);
      } else {
        applyTheme(DEFAULT_SETTINGS.theme);
      }
    } catch {
      applyTheme(DEFAULT_SETTINGS.theme);
    }
    setHydrated(true);
  }, []);

  // 시스템 테마 변화 감지 (system 모드일 때만)
  useEffect(() => {
    if (settings.theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [settings.theme]);

  function update(partial: Partial<AppSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      if (partial.theme !== undefined) applyTheme(next.theme);
      return next;
    });
  }

  const value: SettingsContextValue = {
    settings,
    hydrated,
    setTheme: (t) => update({ theme: t }),
    resetAll: () => {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      setSettings(DEFAULT_SETTINGS);
      applyTheme(DEFAULT_SETTINGS.theme);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// ─── Hook ──────────────────────────────────────────────────────────────────
export function useSettings(): SettingsContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSettings must be used inside SettingsProvider");
  return ctx;
}

// ─── 인라인 테마 스크립트 (hydration mismatch 방지) ────────────────────────
// layout.tsx 의 <head> 에서 즉시 실행되어 초기 페인트 전에 .dark 클래스를 적용.
export const themeInlineScript = `
(function() {
  try {
    var raw = localStorage.getItem('${STORAGE_KEY}');
    var theme = 'system';
    if (raw) {
      var parsed = JSON.parse(raw);
      if (parsed && parsed.theme) theme = parsed.theme;
    }
    var isDark = theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;
