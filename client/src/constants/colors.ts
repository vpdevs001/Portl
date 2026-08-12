/**
 * Color tokens for Portl.
 *
 * "Modern heritage" — warm linen neutrals with an antique-brass accent in
 * light mode; warm charcoal with a lifted champagne gold in dark mode.
 *
 * Source of truth for styling is `src/global.css` (uniwind/Tailwind CSS
 * variables) — use className="bg-background text-foreground" etc. wherever
 * possible. This file mirrors the same hex values as plain JS/TS for the
 * handful of cases where a component needs a raw color instead of a
 * className: native props like <ActivityIndicator color>, <StatusBar>,
 * icon colors, or anywhere outside the uniwind style pipeline.
 *
 * Keep this in sync with global.css by hand — there are only ~14 tokens.
 */

export const Colors = {
  light: {
    background: '#f4f2ec',
    surface: '#eae7de',
    card: '#fcfbf7',
    foreground: '#1d1a13',
    foregroundSecondary: '#5b5546',
    border: '#e1ddcf',
    muted: '#9a917e',
    primary: '#8a6b1d',
    primaryForeground: '#fbf7ea',
    success: '#2e7d4e',
    danger: '#b3402f',
    warning: '#bf7728',
    info: '#3a6ea5'
  },
  dark: {
    background: '#14120e',
    surface: '#1d1a14',
    card: '#242118',
    foreground: '#f0ede2',
    foregroundSecondary: '#a79f8d',
    border: '#383326',
    muted: '#6e6759',
    primary: '#d9b25f',
    primaryForeground: '#241c08',
    success: '#5cb87f',
    danger: '#e0705f',
    warning: '#e0a254',
    info: '#7fa8d0'
  }
} as const;

export type ColorScheme = keyof typeof Colors;
export type ColorToken = keyof (typeof Colors)['light'];
