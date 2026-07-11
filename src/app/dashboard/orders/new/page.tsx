'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import OrderForm from '@/components/OrderForm';

function NewOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId') || '';

  return (
    <div className="space-y-6">
      
      {/* Back button */}
      <button 
        onClick={() => router.push('/dashboard/orders')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Orders
      </button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Prescription Order</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Record a new eye testing invoice receipt</p>
      </div>

      <OrderForm prefilledPatientId={patientId} />

    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <NewOrderContent />
    </Suspense>
  );
}
