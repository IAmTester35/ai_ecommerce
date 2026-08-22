import { useResponsive } from '../../hooks/useResponsive';
import { useWindowDimensions } from 'react-native';

jest.mock('react-native', () => ({
  useWindowDimensions: jest.fn(),
  Platform: { OS: 'ios', select: (o: any) => o.ios },
}));

describe('useResponsive Hook Suite - Viewport Breakpoints & Adapters', () => {
  it('identifies mobile breakpoint (< 768px)', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 375, height: 812 });

    const info = useResponsive();
    expect(info.breakpoint).toBe('mobile');
    expect(info.isMobile).toBe(true);
    expect(info.isTablet).toBe(false);
    expect(info.isDesktop).toBe(false);
    expect(info.isLargeScreen).toBe(false);
    expect(info.isPortrait).toBe(true);
    expect(info.getColumns()).toBe(1);
  });

  it('identifies tablet breakpoint (768px - 1024px)', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 800, height: 1024 });

    const info = useResponsive();
    expect(info.breakpoint).toBe('tablet');
    expect(info.isMobile).toBe(false);
    expect(info.isTablet).toBe(true);
    expect(info.isLargeScreen).toBe(true);
    expect(info.getColumns()).toBe(2);
  });

  it('identifies desktop breakpoint (1024px - 1280px)', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 1100, height: 700 });

    const info = useResponsive();
    expect(info.breakpoint).toBe('desktop');
    expect(info.isDesktop).toBe(true);
    expect(info.isLandscape).toBe(true);
    expect(info.getColumns()).toBe(3);
  });

  it('identifies wide breakpoint (>= 1280px)', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 1440, height: 900 });

    const info = useResponsive();
    expect(info.breakpoint).toBe('wide');
    expect(info.isWideDesktop).toBe(true);
    expect(info.getColumns()).toBe(4);
  });

  it('select function resolves appropriate value based on current active breakpoint', () => {
    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 375, height: 667 });
    let info = useResponsive();
    expect(info.select({ mobile: 'M', tablet: 'T', desktop: 'D' })).toBe('M');

    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 800, height: 1000 });
    info = useResponsive();
    expect(info.select({ mobile: 'M', tablet: 'T', desktop: 'D' })).toBe('T');

    (useWindowDimensions as jest.Mock).mockReturnValue({ width: 1200, height: 800 });
    info = useResponsive();
    expect(info.select({ mobile: 'M', tablet: 'T', desktop: 'D' })).toBe('D');
  });
});
