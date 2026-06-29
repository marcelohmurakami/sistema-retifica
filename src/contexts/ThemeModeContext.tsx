import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ThemeProvider } from "styled-components";
import { darkTheme, lightTheme } from "../styles/theme";

type ThemeMode = "light" | "dark";

type ThemeModeContextValue = {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleThemeMode: () => void;
};

const STORAGE_KEY = "retifica-theme-mode";

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

function getInitialThemeMode(): ThemeMode {
  if (typeof window === "undefined") return "light";

  const savedMode = window.localStorage.getItem(STORAGE_KEY);

  if (savedMode === "light" || savedMode === "dark") {
    return savedMode;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeMode] = useState<ThemeMode>(getInitialThemeMode);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, themeMode);
    document.documentElement.dataset.theme = themeMode;
    document.documentElement.style.colorScheme = themeMode;
  }, [themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      toggleThemeMode: () =>
        setThemeMode((currentMode) =>
          currentMode === "light" ? "dark" : "light"
        ),
    }),
    [themeMode]
  );

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={themeMode === "dark" ? darkTheme : lightTheme}>
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);

  if (!context) {
    throw new Error("useThemeMode deve ser usado dentro de AppThemeProvider.");
  }

  return context;
}
