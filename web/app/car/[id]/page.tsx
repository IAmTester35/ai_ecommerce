import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CarDetailsClient } from './CarDetailsClient';
import { DatabaseCar } from '@/lib/types';

async function CarData({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const resolvedParams = await paramsPromise;
  const supabase = await createClient();
  const { data: car, error } = await supabase
    .from('cars')
    .select('*')
    .eq('id', resolvedParams.id)
    .single();

  if (error || !car) {
    return notFound();
  }

  return <CarDetailsClient car={car as DatabaseCar} />;
}

export default function CarDetails({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <CarData paramsPromise={params} />
    </Suspense>
  );
}
