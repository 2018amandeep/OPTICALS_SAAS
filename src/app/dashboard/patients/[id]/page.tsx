'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Plus, 
  ChevronLeft,
  Calendar,
  DollarSign,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface PatientProfileProps {
  params: Promise<{ id: string }>;
}

export default function PatientProfilePage({ params }: PatientProfileProps) {
  const router = useRouter();
  const { id } = React.use(params);
  
  const [patient, setPatient] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('₹');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/patients/${id}`);
        if (!res.ok) throw new Error('Patient not found');
        const data = await res.json();
        setPatient(data.patient);
        setOrders(data.orders);
        
        // Get currency symbol from shop
        const shopRes = await fetch('/api/auth/me');
        if (shopRes.ok) {
          const shopData = await shopRes.json();
          if (shopData.shop?.currency === 'USD') setCurrencySymbol('$');
          else if (shopData.shop?.currency === 'EUR') setCurrencySymbol('€');
        }
      } catch (err) {
        router.push('/dashboard/patients');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Back navigation */}
      <button 
        onClick={() => router.push('/dashboard/patients')}
        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Patients
      </button>

      {/* Profile Card & Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Card */}
        <div className="lg:col-span-1 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-md shadow-indigo-500/10">
                {patient?.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full">
                  Code: {patient?.code || 'None'}
                </span>
                <h3 className="font-extrabold text-lg mt-1">{patient?.name}</h3>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4 space-y-3.5 text-sm font-semibold">
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{patient?.phone}</span>
              </div>
              {patient?.email && (
                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{patient?.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
                <Activity className="w-4 h-4 text-slate-400" />
                <span>{patient?.age ? `${patient?.age} Years` : 'Age: --'} / {patient?.gender || 'Gender: --'}</span>
              </div>
              {patient?.address && (
                <div className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4 mt-0.5 text-slate-400 flex-shrink-0" />
                  <span>{patient?.address}</span>
                </div>
              )}
            </div>
          </div>

          {patient?.notes && (
            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/60 text-xs leading-relaxed">
              <p className="font-bold text-slate-500 dark:text-slate-400 mb-1">Optic / Medical Notes:</p>
              <p className="text-slate-600 dark:text-slate-300 font-medium">{patient?.notes}</p>
            </div>
          )}
        </div>

        {/* Orders History (Right 2 columns) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h3 className="font-bold text-base">Prescription History</h3>
                <p className="text-xs text-slate-400 mt-0.5">Records of lenses, frames, and payments booked for this patient</p>
              </div>
              <Link href={`/dashboard/orders/new?patientId=${patient?._id}`}>
                <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer flex items-center justify-center gap-1.5 text-xs py-2">
                  <Plus className="w-4 h-4" />
                  New Prescription
                </Button>
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm font-medium">
                No orders booked for this patient yet.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order._id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 hover:border-slate-200 dark:hover:border-slate-800 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{order.orderNumber}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                          ${order.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-600' :
                            order.status === 'Ordered' ? 'bg-blue-500/10 text-blue-600' :
                            order.status === 'In Lab' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-slate-500/10 text-slate-600'}
                        `}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          Booked: {new Date(order.bookingDate).toLocaleDateString()}
                        </span>
                        <span>
                          Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 pt-1.5 flex flex-wrap gap-x-4">
                        {order.frame && <span>Frame: <strong className="text-slate-800 dark:text-slate-200">{order.frame}</strong></span>}
                        {order.lenses && <span>Lenses: <strong className="text-slate-800 dark:text-slate-200">{order.lenses}</strong></span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5">
                      <div className="text-right">
                        <p className="text-xs text-slate-400 font-semibold">Outstanding</p>
                        <p className={`text-sm font-extrabold ${order.financials.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          {currencySymbol}{order.financials.balance}
                        </p>
                      </div>
                      <Link href={`/dashboard/orders?id=${order._id}`}>
                        <Button variant="outline" size="sm" className="h-9 px-3 cursor-pointer">
                          Details
                          <ArrowUpRight className="w-3.5 h-3.5 ml-1 text-slate-400" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
