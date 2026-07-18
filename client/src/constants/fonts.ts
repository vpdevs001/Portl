import {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_500Medium_Italic
} from '@expo-google-fonts/fraunces';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold
} from '@expo-google-fonts/manrope';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold
} from '@expo-google-fonts/jetbrains-mono';

/**
 * Font families for Portl.
 *
 * Display/headings: Fraunces — a soft-contrast serif. This is where the
 * "classy" feel lives; use it sparingly, for titles and moments that
 * should feel considered rather than every label.
 *
 * Body/UI: Manrope — warmer and slightly more characterful than a
 * standard grotesk (Inter/Roboto), still very legible at small sizes.
 * This carries almost all UI text.
 *
 * Numeric: JetBrains Mono — tabular figures for money, account numbers,
 * dates and codes, so amounts read as precise data rather than prose.
 * Only use it for numeric/code-like values, not body copy.
 *
 * React Native needs a distinct font-family string per weight (no
 * font-weight synthesis), so each weight is its own named export from
 * @expo-google-fonts. These names are also used as the CSS variable
 * values in globals.css — keep both in sync.
 */
export const FontFamily = {
  serif: {
    medium: 'Fraunces_500Medium',
    semibold: 'Fraunces_600SemiBold',
    bold: 'Fraunces_700Bold',
    italic: 'Fraunces_500Medium_Italic'
  },
  sans: {
    regular: 'Manrope_400Regular',
    medium: 'Manrope_500Medium',
    semibold: 'Manrope_600SemiBold',
    bold: 'Manrope_700Bold'
  },
  mono: {
    regular: 'JetBrainsMono_400Regular',
    medium: 'JetBrainsMono_500Medium',
    semibold: 'JetBrainsMono_600SemiBold'
  }
} as const;

/** Pass to expo-font's useFonts() in the root layout. */
export const fontsToLoad = {
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  Fraunces_500Medium_Italic,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold
};

/**
 * Role-based type scale. Use these with StyleSheet.create() for components
 * that need RN style objects (charts, animated text, etc). For everything
 * else, prefer the matching Tailwind utility in globals.css, e.g.
 * className="text-h1 font-serif-semibold".
 */
export const Type = {
  // Serif — display / headings, used sparingly
  display: { fontFamily: FontFamily.serif.semibold, fontSize: 34, lineHeight: 40 },
  h1: { fontFamily: FontFamily.serif.semibold, fontSize: 26, lineHeight: 32 },
  h2: { fontFamily: FontFamily.serif.medium, fontSize: 21, lineHeight: 27 },
  h3: { fontFamily: FontFamily.sans.semibold, fontSize: 17, lineHeight: 23 },
  // Sans — body / UI, carries almost everything
  body: { fontFamily: FontFamily.sans.regular, fontSize: 16, lineHeight: 24 },
  bodyMedium: { fontFamily: FontFamily.sans.medium, fontSize: 16, lineHeight: 24 },
  bodySmall: { fontFamily: FontFamily.sans.regular, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: FontFamily.sans.medium, fontSize: 12, lineHeight: 16 },
  label: {
    fontFamily: FontFamily.sans.semibold,
    fontSize: 13,
    lineHeight: 16,
    letterSpacing: 0.2
  },
  // Numeric — balances, prices, account/routing numbers, OTPs, dates
  amountLarge: { fontFamily: FontFamily.mono.semibold, fontSize: 32, lineHeight: 38 },
  amount: { fontFamily: FontFamily.mono.medium, fontSize: 16, lineHeight: 22 },
  amountSmall: { fontFamily: FontFamily.mono.regular, fontSize: 13, lineHeight: 18 }
} as const;

export type TypeRole = keyof typeof Type;
