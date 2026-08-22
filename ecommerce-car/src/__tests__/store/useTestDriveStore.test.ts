import { useTestDriveStore } from '../../store/useTestDriveStore';
import { testDriveService } from '../../services/testDriveService';

jest.mock('../../services/testDriveService', () => ({
  testDriveService: {
    getTestDrives: jest.fn(),
    bookTestDrive: jest.fn(),
    cancelTestDrive: jest.fn(),
  },
}));

describe('useTestDriveStore Suite - Test Drive State Management', () => {
  const sampleBooking = {
    id: 'td-1',
    user_id: 'u1',
    car_id: 'car-1',
    scheduled_date: '2024-06-01',
    status: 'pending' as const,
    created_at: '2024-01-01',
  };

  beforeEach(() => {
    useTestDriveStore.setState({
      testDrives: [],
      isLoading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('fetchTestDrives loads bookings into store', async () => {
    (testDriveService.getTestDrives as jest.Mock).mockResolvedValueOnce([sampleBooking]);

    await useTestDriveStore.getState().fetchTestDrives('u1');

    expect(useTestDriveStore.getState().testDrives).toEqual([sampleBooking]);
    expect(useTestDriveStore.getState().isLoading).toBe(false);
  });

  it('bookTestDrive creates booking and appends to store', async () => {
    (testDriveService.bookTestDrive as jest.Mock).mockResolvedValueOnce(sampleBooking);

    const res = await useTestDriveStore.getState().bookTestDrive('u1', 'car-1', '2024-06-01');

    expect(res).toEqual(sampleBooking);
    expect(useTestDriveStore.getState().testDrives).toContainEqual(sampleBooking);
  });

  it('cancelTestDrive updates status of cancelled booking in store', async () => {
    useTestDriveStore.setState({ testDrives: [sampleBooking] });
    const cancelled = { ...sampleBooking, status: 'cancelled' as const };
    (testDriveService.cancelTestDrive as jest.Mock).mockResolvedValueOnce(cancelled);

    await useTestDriveStore.getState().cancelTestDrive('td-1');

    expect(useTestDriveStore.getState().testDrives[0].status).toBe('cancelled');
  });
});
