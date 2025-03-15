import { theme as baseTheme } from './theme';

export const theme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    background: '#000000',
    foreground: '#ffffff',
    text: '#ffffff',
    card: '#000000',
    border: '#ffffff',
    primary: {
      ...baseTheme.colors.primary,
      DEFAULT: '#ffffff',
      foreground: '#000000',
    },
    secondary: {
      ...baseTheme.colors.secondary,
      DEFAULT: '#ffffff',
      foreground: '#000000',
    },
    muted: {
      ...baseTheme.colors.muted,
      DEFAULT: '#000000',
      foreground: '#ffffff',
    },
    accent: {
      ...baseTheme.colors.accent,
      DEFAULT: '#000000',
      foreground: '#ffffff',
    },
    destructive: {
      ...baseTheme.colors.destructive,
      DEFAULT: '#ffffff',
      foreground: '#000000',
    },
  },
}; 