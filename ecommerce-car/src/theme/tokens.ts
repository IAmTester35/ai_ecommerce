/**
 * AutoMatch AI - Automotive E-Commerce Minimalist Design Tokens
 * Refined standard for minimalist luxury automotive aesthetics
 */

export const colors = {
  // Backgrounds & Base Surfaces (Obsidian & Graphite)
  background: '#090A0C',          // Deep Obsidian Black
  surface: '#11141B',             // Refined Slate Surface
  surfaceElevated: '#171B24',     // Elevated Card & Sheet Surface
  surfaceElevatedHover: '#1F2430',// Interactive state
  surfaceGlass: 'rgba(17, 20, 27, 0.90)', // Glass backdrop
  surfaceSubtle: 'rgba(255, 255, 255, 0.03)',

  // Borders & Outlines (Subtle & clean)
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.04)',
  borderHighlight: 'rgba(59, 130, 246, 0.35)',

  // Primary Electric Sapphire / Porsche Blue
  primary: '#3B82F6',             // Clean Sapphire Blue
  primaryHover: '#60A5FA',
  primaryMuted: 'rgba(59, 130, 246, 0.12)',
  primaryGlow: 'rgba(59, 130, 246, 0.20)',

  // Secondary Accents (Soft Indigo)
  secondary: '#6366F1',           // Soft Indigo
  secondaryHover: '#818CF8',
  secondaryMuted: 'rgba(99, 102, 241, 0.12)',

  // Semantic & Feedback Colors
  conflict: '#F59E0B',            // Warm Amber (Ratings & Notices)
  conflictMuted: 'rgba(245, 158, 11, 0.12)',
  
  success: '#10B981',             // Emerald
  successMuted: 'rgba(16, 185, 129, 0.12)',
  
  danger: '#EF4444',              // Rose Red
  dangerMuted: 'rgba(239, 68, 68, 0.12)',
  
  warning: '#F97316',             // Soft Orange
  warningMuted: 'rgba(249, 115, 22, 0.12)',

  info: '#0EA5E9',                // Sky Blue
  infoMuted: 'rgba(14, 165, 233, 0.12)',

  // Typography Palette
  text: '#F8FAFC',                // Crisp Ice White
  textSecondary: '#94A3B8',       // Slate Grey
  textMuted: '#64748B',           // Dark Slate for microcopy
  textDark: '#090A0C',            // Dark text for bright badges

  // Card specific tokens
  cardBg: '#12151C',
  cardBorder: 'rgba(255, 255, 255, 0.07)',

  // TabBar tokens
  tabBarBg: '#11141B',
  tabBarBorder: 'rgba(255, 255, 255, 0.08)',
  tabBarActive: '#3B82F6',
  tabBarInactive: '#64748B',

  // Gradients
  gradientStart: '#3B82F6',
  gradientEnd: '#6366F1',
  gradientGoldStart: '#F59E0B',
  gradientGoldEnd: '#D97706',
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
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 22,
  '3xl': 28,
  full: 9999,
} as const;

export const typography = {
  sizes: {
    '2xs': 10,
    xs: 11,
    sm: 12,
    base: 13,
    md: 14,
    lg: 15,
    xl: 16,
    '2xl': 18,
    '3xl': 20,
    '4xl': 24,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '700' as const,
    black: '800' as const,
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.30,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 10,
    elevation: 6,
  },
  glowCyan: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
  glowPurple: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 3,
  },
} as const;

export const layout = {
  screenPadding: spacing.lg,
  cardPadding: spacing.md,
  bottomBarHeight: 60,
  headerHeight: 52,
} as const;

