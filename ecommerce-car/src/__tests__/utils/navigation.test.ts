import { router } from 'expo-router';
import { safeBack } from '../../utils/navigation';

jest.mock('expo-router', () => ({
  router: {
    canGoBack: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
  },
}));

describe('safeBack utility', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls router.back() when router.canGoBack() is true', () => {
    (router.canGoBack as jest.Mock).mockReturnValue(true);

    safeBack();

    expect(router.canGoBack).toHaveBeenCalledTimes(1);
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('falls back to default /(tabs) when router.canGoBack() is false', () => {
    (router.canGoBack as jest.Mock).mockReturnValue(false);

    safeBack();

    expect(router.canGoBack).toHaveBeenCalledTimes(1);
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/(tabs)');
  });

  it('falls back to custom route when specified and cannot go back', () => {
    (router.canGoBack as jest.Mock).mockReturnValue(false);

    safeBack('/orders');

    expect(router.canGoBack).toHaveBeenCalledTimes(1);
    expect(router.back).not.toHaveBeenCalled();
    expect(router.replace).toHaveBeenCalledWith('/orders');
  });
});
