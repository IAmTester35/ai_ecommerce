import { useWindowDimensions } from 'react-native';
import { breakpoints, layout } from '../theme';

export type BreakpointKey = 'mobile' | 'tablet' | 'desktop' | 'wide';

export interface ResponsiveSelectOptions<T> {
  mobile: T;
  tablet?: T;
  desktop?: T;
  wide?: T;
  default?: T;
}

export interface ResponsiveInfo {
  width: number;
  height: number;
  breakpoint: BreakpointKey;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWideDesktop: boolean;
  isLargeScreen: boolean; // tablet or desktop
  isLandscape: boolean;
  isPortrait: boolean;
  select: <T>(options: ResponsiveSelectOptions<T>) => T;
  getColumns: (custom?: { mobile?: number; tablet?: number; desktop?: number; wide?: number }) => number;
  containerMaxWidth: number;
}

/**
 * Custom hook for viewport-based responsive breakpoints and layout adaptations.
 */
export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  let breakpoint: BreakpointKey = 'mobile';
  if (width >= breakpoints.wide) {
    breakpoint = 'wide';
  } else if (width >= breakpoints.desktop) {
    breakpoint = 'desktop';
  } else if (width >= breakpoints.tablet) {
    breakpoint = 'tablet';
  } else {
    breakpoint = 'mobile';
  }

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop' || breakpoint === 'wide';
  const isWideDesktop = breakpoint === 'wide';
  const isLargeScreen = width >= breakpoints.tablet;
  const isLandscape = width > height;
  const isPortrait = height >= width;

  const select = <T>(options: ResponsiveSelectOptions<T>): T => {
    if (breakpoint === 'wide' && options.wide !== undefined) {
      return options.wide;
    }
    if ((breakpoint === 'desktop' || breakpoint === 'wide') && options.desktop !== undefined) {
      return options.desktop;
    }
    if (breakpoint === 'tablet' && options.tablet !== undefined) {
      return options.tablet;
    }
    if (options.mobile !== undefined) {
      return options.mobile;
    }
    if (options.default !== undefined) {
      return options.default;
    }
    return options.mobile;
  };

  const getColumns = (custom?: { mobile?: number; tablet?: number; desktop?: number; wide?: number }): number => {
    const config = {
      mobile: 1,
      tablet: 2,
      desktop: 3,
      wide: 4,
      ...custom,
    };
    return select(config);
  };

  const containerMaxWidth = Math.min(width, layout.containerMaxWidth.xl);

  return {
    width,
    height,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isWideDesktop,
    isLargeScreen,
    isLandscape,
    isPortrait,
    select,
    getColumns,
    containerMaxWidth,
  };
}
