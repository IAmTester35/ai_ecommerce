/**
 * AutoMatch AI - Automotive E-Commerce Design System Tokens
 * Unified standard for luxury cyber-automotive aesthetics
 */

export const colors = {
  // Backgrounds & Base Surfaces
  background: '#0B0E14',         // Deep Titanium Obsidian Core
  surface: '#141A26',            // Base surface
  surfaceElevated: '#1C2333',    // Elevated card & sheet surface
  surfaceElevatedHover: '#232C40',// Interactive state
  surfaceGlass: 'rgba(28, 35, 51, 0.85)', // Glassmorphism backdrop

  // Borders & Outlines
  border: '#253046',             // Subtle container border
  borderLight: 'rgba(255, 255, 255, 0.08)',
  borderHighlight: 'rgba(0, 229, 255, 0.35)',

  // Primary Electric Accents
  primary: '#00E5FF',            // Electric Cyan - primary actions & branding
  primaryHover: '#33EBFF',
  primaryMuted: 'rgba(0, 229, 255, 0.12)',
  primaryGlow: 'rgba(0, 229, 255, 0.25)',

  // Secondary Accents
  secondary: '#7C4DFF',          // Vivid Electric Purple - AI reasoning & compare
  secondaryHover: '#9670FF',
  secondaryMuted: 'rgba(124, 77, 255, 0.15)',

  // Semantic & Feedback Colors
  conflict: '#FFB300',           // Amber Gold - AI Conflict Warning & Rating stars
  conflictMuted: 'rgba(255, 179, 0, 0.15)',
  
  success: '#00E676',            // Mint Emerald - Paid, In Stock, Confirmed
  successMuted: 'rgba(0, 230, 118, 0.15)',
  
  danger: '#FF5252',             // Coral Red - Discount badge, Cancel, Delete
  dangerMuted: 'rgba(255, 82, 82, 0.15)',
  
  warning: '#FF9100',            // Orange Alert
  warningMuted: 'rgba(255, 145, 0, 0.15)',

  info: '#29B6F6',               // Sky Blue - Info notices
  infoMuted: 'rgba(41, 182, 246, 0.15)',

  // Typography Palette
  text: '#F2F5F8',               // High contrast ice-white for headings & primary
  textSecondary: '#94A3B8',      // Soft slate for subtitles & secondary info
  textMuted: '#64748B',          // Low contrast for captions & placeholder
  textDark: '#0B0E14',           // Dark text on bright accent buttons

  // Card specific tokens
  cardBg: '#131822',
  cardBorder: '#1E2638',

  // Gradients
  gradientStart: '#00E5FF',
  gradientEnd: '#7C4DFF',
  gradientGoldStart: '#FFD700',
  gradientGoldEnd: '#FF8C00',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const typography = {
  sizes: {
    '2xs': 10,
    xs: 11,
    sm: 12,
    base: 14,
    md: 15,
    lg: 16,
    xl: 18,
    '2xl': 20,
    '3xl': 24,
    '4xl': 28,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
    black: '900' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  glowCyan: {
    shadowColor: '#00E5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  glowPurple: {
    shadowColor: '#7C4DFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
} as const;

export const layout = {
  screenPadding: spacing.lg,
  cardPadding: spacing.lg,
  bottomBarHeight: 64,
  headerHeight: 56,
} as const;
