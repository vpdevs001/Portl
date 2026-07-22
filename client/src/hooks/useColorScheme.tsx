import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScopedTheme } from 'uniwind';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedScheme = 'light' | 'dark';

const STORAGE_KEY = 'portl-theme-preference';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  resolvedScheme: ResolvedScheme;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * Wraps the app, persists the user's Appearance choice (light/dark/system —
 * defaults to system), and applies it via uniwind's <ScopedTheme> so
 * Tailwind classes repaint immediately. Pair with the `useColorScheme` hook
 * exported from this file (not react-native's) anywhere a screen picks
 * colors imperatively (icons, ActivityIndicator, etc.) so both paths agree.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (isThemePreference(stored)) {
          setPreferenceState(stored);
        }
      })
      .catch(() => undefined);
  }, []);

  function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }

  const resolvedScheme: ResolvedScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  const value = useMemo(
    () => ({ preference, setPreference, resolvedScheme }),
    [preference, resolvedScheme]
  );

  // Only scope the theme when the user has explicitly overridden it — in
  // 'system' mode, leave uniwind alone so it keeps following the OS
  // Appearance listener natively (including live changes).
  const content =
    preference === 'system' ? (
      children
    ) : (
      <ScopedTheme theme={resolvedScheme}>{children}</ScopedTheme>
    );

  return <ThemeContext.Provider value={value}>{content}</ThemeContext.Provider>;
}

/** Read + update the user's Appearance preference (light/dark/system). */
export function useThemePreference() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemePreference must be used within a ThemeProvider');
  }
  return ctx;
}

/**
 * Drop-in replacement for react-native's `useColorScheme`, resolved against
 * the user's saved preference instead of only the OS setting. Falls back to
 * the system scheme if used outside a ThemeProvider.
 */
export function useColorScheme(): ResolvedScheme {
  const ctx = useContext(ThemeContext);
  const systemScheme = useSystemColorScheme();

  if (!ctx) {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }

  return ctx.resolvedScheme;
}
