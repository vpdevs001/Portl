/**
 * Color tokens for Portl.
 *
 * Faint sage backgrounds with an antique-gold accent (deep forest + lifted
 * champagne gold in dark mode) — quieter and more "private bank" than a
 * typical tech blue.
 *
 * Source of truth for styling is `src/globals.css` (uniwind/Tailwind CSS
 * variables) — use className="bg-background text-foreground" etc. wherever
 * possible. This file mirrors the same hex values as plain JS/TS for the
 * handful of cases where a component needs a raw color instead of a
 * className: native props like <ActivityIndicator color>, <StatusBar>,
 * chart/icon libraries, or anywhere outside the uniwind style pipeline.
 *
 * Keep this in sync with globals.css by hand — there are only ~12 tokens.
 */

export const Colors = {
  light: {
    background: '#f5f7f2',
    surface: '#ecf0e7',
    card: '#fbfcf9',
    foreground: '#14201a',
    foregroundSecondary: '#56635a',
    border: '#dde4d6',
    muted: '#93a08d',
    primary: '#a9832e',
    primaryForeground: '#241c0c',
    success: '#2f7a4f',
    danger: '#b23b30',
    warning: '#c97a2b'
  },
  dark: {
    background: '#0b120e',
    surface: '#101913',
    card: '#141f18',
    foreground: '#edf1ea',
    foregroundSecondary: '#9aa79a',
    border: '#23302a',
    muted: '#5e6d64',
    primary: '#d4af63',
    primaryForeground: '#1a1409',
    success: '#4caf75',
    danger: '#e0685c',
    warning: '#e0a354'
  }
} as const;

export type ColorScheme = keyof typeof Colors;
export type ColorToken = keyof (typeof Colors)['light'];
