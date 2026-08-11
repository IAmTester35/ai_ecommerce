import { supabase } from '../api/supabaseClient';
import { TestDrive } from '../types';

export const testDriveService = {
  bookTestDrive: async (
    _userId: string | undefined,
    carId: string,
    scheduledDate: string,
    notes?: string
  ): Promise<TestDrive> => {
    const { data, error } = await supabase
      .from('test_drives')
      .insert([
        {
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

  getTestDrives: async (): Promise<TestDrive[]> => {
    const { data, error } = await supabase
      .from('test_drives')
      .select('*, car:cars(*)')
      .order('scheduled_date', { ascending: true });

    if (error) throw error;
    return data as TestDrive[];
  },

  cancelTestDrive: async (testDriveId: string): Promise<TestDrive> => {
    const { data, error } = await supabase
      .from('test_drives')
      .update({ status: 'cancelled' })
      .eq('id', testDriveId)
      .select('*, car:cars(*)')
      .single();

    if (error) throw error;
    return data as TestDrive;
  },
};
