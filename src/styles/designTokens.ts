/**
 * Design Tokens for TerraPeak Outpost
 * Reference: Alpine Expeditionary Modernism / TerraPeak Operations
 * Primary Forest Green: #152A20
 * Secondary Orange Accent: #D97845
 * Supporting Dark Green: #1F3D2B
 * Main Background: #F3EFE6
 * Secondary Surface: #EBE6DC
 * Borders & Dividers: #D8D2C5
 * Primary Text: #152A20 / #111D16
 * Secondary Text: #5C665F
 * Text on Dark Surfaces: #F3EFE6
 * Corner Radii: Small rounded-sm / rounded-md (rectangular with subtle rounding)
 */

export const DESIGN_TOKENS = {
  colors: {
    primary: {
      DEFAULT: '#152A20',
      hover: '#1E3A2D',
      dark: '#0E1D16',
      light: '#D7ECE1',
    },
    secondary: {
      DEFAULT: '#D97845',
      hover: '#C66735',
      light: '#FDF2EC',
      border: '#F1BA9B',
    },
    tertiary: {
      DEFAULT: '#1F3D2B',
      light: '#2B4E3C',
    },
    neutral: {
      canvas: '#F3EFE6',
      surface: '#F8F6F1',
      surfaceAlt: '#EBE6DC',
      border: '#D8D2C5',
      dark: '#152A20',
      textPrimary: '#111D16',
      textSecondary: '#5C665F',
      textMuted: '#7A857E',
    },
    status: {
      success: '#152A20',
      successBg: '#E0EFE6',
      warning: '#D97845',
      warningBg: '#FDF2EC',
      error: '#B91C1C',
      errorBg: '#FEE2E2',
    }
  },
  fonts: {
    headline: 'font-headline',
    body: 'font-body',
    label: 'font-label',
  },
  radius: {
    none: 'rounded-none',
    sm: 'rounded-xs',
    md: 'rounded-sm',
    lg: 'rounded-md',
  }
} as const;
