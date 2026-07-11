'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import OrderForm from '@/components/OrderForm';

interface EditOrderProps {
  params: Promise<{ id: string }>;
}

export default function EditOrderPage({ params }: EditOrderProps) {
  const router = useRouter();
  const { id } = React.use(params);

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
        <h1 className="text-2xl font-bold tracking-tight">Edit Prescription Order</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Update eye measurements and payment details</p>
      </div>

      <OrderForm orderId={id} />

    </div>
  );
}
