import { supabase } from '../api/supabaseClient';
import { TestDrive } from '../types';

export const testDriveService = {
  getTestDrives: async (userId?: string): Promise<TestDrive[]> => {
    let query = supabase
      .from('test_drives')
      .select('*, showroom:showrooms(*), car:cars(*, showroom:showrooms(*))')
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[testDriveService] Error fetching test drives:', error.message);
      return [];
    }
    return (data || []) as TestDrive[];
  },

  bookTestDrive: async (
    userId: string | undefined,
    carId: string,
    scheduledDate: string,
    showroomId?: string,
    notes?: string
  ): Promise<TestDrive> => {
    const record: Record<string, any> = {
      car_id: carId,
      scheduled_date: scheduledDate,
      notes: notes || undefined,
    };
    if (showroomId) {
      record['showroom_id'] = showroomId;
    }
    if (userId) {
      record['user_id'] = userId;
    }

    const { data, error } = await supabase
      .from('test_drives')
      .insert([record])
      .select('*, showroom:showrooms(*), car:cars(*, showroom:showrooms(*))')
      .single();

    if (error) {
      console.error('[testDriveService] Error booking test drive:', error.message);
      throw error;
    }
    return data as TestDrive;
  },

  cancelTestDrive: async (testDriveId: string): Promise<TestDrive> => {
    const { data, error } = await supabase
      .from('test_drives')
      .update({ status: 'cancelled' })
      .eq('id', testDriveId)
      .select('*, showroom:showrooms(*), car:cars(*, showroom:showrooms(*))')
      .single();

    if (error) {
      console.error('[testDriveService] Error cancelling test drive:', error.message);
      throw error;
    }
    return data as TestDrive;
  },
};
