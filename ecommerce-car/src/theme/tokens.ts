/**
 * AutoMatch AI - Automotive E-Commerce Minimalist Design Tokens
 * Refined standard for minimalist luxury automotive aesthetics
 */

export const colors = {
  // Backgrounds & Base Surfaces (Obsidian & Graphite)
  background: '#090A0C',          // Deep Obsidian Black
  surface: '#11141B',             // Refined Slate Surface
  surfaceElevated: '#151922',     // Elevated Card & Sheet Surface
  surfaceElevatedHover: '#1C222E',// Interactive state
  surfaceGlass: 'rgba(17, 20, 27, 0.90)', // Glass backdrop
  surfaceSubtle: 'rgba(255, 255, 255, 0.03)',

  // Borders & Outlines (Subtle & clean - minimal use)
  border: 'rgba(255, 255, 255, 0.05)',
  borderLight: 'rgba(255, 255, 255, 0.02)',
  borderHighlight: 'rgba(59, 130, 246, 0.30)',

  // Primary Electric Sapphire / Porsche Blue
  primary: '#3B82F6',             // Clean Sapphire Blue
  primaryHover: '#60A5FA',
  primaryMuted: 'rgba(59, 130, 246, 0.10)',
  primaryGlow: 'rgba(59, 130, 246, 0.18)',

  // Secondary Accents (Soft Indigo)
  secondary: '#6366F1',           // Soft Indigo
  secondaryHover: '#818CF8',
  secondaryMuted: 'rgba(99, 102, 241, 0.10)',

  // Semantic & Feedback Colors
  conflict: '#F59E0B',            // Warm Amber (Ratings & Notices)
  conflictMuted: 'rgba(245, 158, 11, 0.10)',
  
  success: '#10B981',             // Emerald
  successMuted: 'rgba(16, 185, 129, 0.10)',
  
  danger: '#EF4444',              // Rose Red
  dangerMuted: 'rgba(239, 68, 68, 0.10)',
  
  warning: '#F97316',             // Soft Orange
  warningMuted: 'rgba(249, 115, 22, 0.10)',

  info: '#0EA5E9',                // Sky Blue
  infoMuted: 'rgba(14, 165, 233, 0.10)',

  // Typography Palette
  text: '#F8FAFC',                // Crisp Ice White
  textSecondary: '#94A3B8',       // Slate Grey
  textMuted: '#64748B',           // Dark Slate for microcopy
  textDark: '#090A0C',            // Dark text for bright badges

  // Card specific tokens
  cardBg: '#13161F',
  cardBorder: 'transparent',

  // TabBar tokens
  tabBarBg: '#11141B',
  tabBarBorder: 'rgba(255, 255, 255, 0.04)',
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
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
  full: 9999,
} as const;

export const typography = {
  sizes: {
    '2xs': 11,
    xs: 12,
    sm: 13,
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
    extrabold: '700' as const,
    black: '800' as const,
  },
  lineHeights: {
    tight: 1.3,
    normal: 1.55,
    relaxed: 1.75,
  },
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 5,
  },
  glowCyan: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
  glowPurple: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 2,
  },
} as const;

export const layout = {
  screenPadding: spacing['2xl'], // 24px
  cardPadding: spacing.xl,       // 20px
  bottomBarHeight: 64,
  headerHeight: 56,
} as const;

