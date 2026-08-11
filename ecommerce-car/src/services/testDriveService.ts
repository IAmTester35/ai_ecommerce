import { supabase } from '../api/supabaseClient';
import { TestDrive } from '../types';

export const testDriveService = {
  bookTestDrive: async (
    userId: string,
    carId: string,
    scheduledDate: string,
    notes?: string
  ): Promise<TestDrive> => {
    const { data, error } = await supabase
      .from('test_drives')
      .insert([
        {
          user_id: userId,
          car_id: carId,
          scheduled_date: scheduledDate,
          notes: notes || null,
        },
      ])
      .select('*, car:cars(*)')
      .single();

    if (error) throw error;
    return data as TestDrive;
  },

  getTestDrives: async (userId: string): Promise<TestDrive[]> => {
    const { data, error } = await supabase
      .from('test_drives')
      .select('*, car:cars(*)')
      .eq('user_id', userId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data as TestDrive[];
  },

  cancelTestDrive: async (testDriveId: string, userId: string): Promise<TestDrive> => {
    const { data, error } = await supabase
      .from('test_drives')
      .update({ status: 'cancelled' })
      .eq('id', testDriveId)
      .eq('user_id', userId)
      .select('*, car:cars(*)')
      .single();

    if (error) throw error;
    return data as TestDrive;
  },
};
