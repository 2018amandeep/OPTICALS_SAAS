'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Plus, 
  Calendar, 
  Eye, 
  Edit2, 
  Trash2, 
  AlertCircle,
  Filter
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import OrderReceipt from '@/components/OrderReceipt';

function OrdersListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightOrderId = searchParams.get('id');

  const [orders, setOrders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Receipt modal states
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('₹');

  const fetchOrders = async (query = '', ordStatus = '', payStatus = '') => {
    try {
      const url = `/api/orders?search=${encodeURIComponent(query)}&status=${ordStatus}&paymentStatus=${payStatus}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data.orders);

      // If highlightOrderId is present, open that receipt immediately
      if (highlightOrderId) {
        const highlighted = data.orders.find((o: any) => o._id === highlightOrderId);
        if (highlighted) {
          setSelectedOrder(highlighted);
          setReceiptOpen(true);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get currency symbol from shop settings
    async function getCurrency() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.shop?.currency === 'USD') setCurrencySymbol('$');
          else if (data.shop?.currency === 'EUR') setCurrencySymbol('€');
        }
      } catch (err) {
        console.error(err);
      }
    }
    getCurrency();
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchOrders(search, status, paymentStatus);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, status, paymentStatus, highlightOrderId]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prescription order?')) return;
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete order');
      fetchOrders(search, status, paymentStatus);
      if (selectedOrder?._id === id) {
        setReceiptOpen(false);
      }
    } catch (err) {
      alert('Error deleting order');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Prescriptions & Orders</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Search, filter and manage optical receipts</p>
        </div>
        <Link href="/dashboard/orders/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" />
            New Order
          </Button>
        </Link>
      </div>

      {/* Filter and Search controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        
        {/* Search */}
        <div className="relative sm:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4.5 h-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by Order # or patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-slate-50 dark:bg-slate-950 outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status filter */}
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: '', label: 'All Orders' },
            { value: 'Ordered', label: 'Ordered' },
            { value: 'In Lab', label: 'In Lab' },
            { value: 'Ready', label: 'Ready' },
            { value: 'Delivered', label: 'Delivered' },
            { value: 'Cancelled', label: 'Cancelled' },
          ]}
          className="!bg-slate-50 dark:!bg-slate-950"
        />

        {/* Payment filter */}
        <Select
          value={paymentStatus}
          onChange={(e) => setPaymentStatus(e.target.value)}
          options={[
            { value: '', label: 'All Payments' },
            { value: 'Paid', label: 'Paid' },
            { value: 'Partial', label: 'Partial' },
            { value: 'Unpaid', label: 'Unpaid' },
          ]}
          className="!bg-slate-50 dark:!bg-slate-950"
        />

      </div>

      {/* Orders Grid/Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-medium text-sm">
            No orders found matching filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Order No</th>
                  <th className="py-3.5 px-6">Patient</th>
                  <th className="py-3.5 px-6">Date Details</th>
                  <th className="py-3.5 px-6">Lenses / Frame</th>
                  <th className="py-3.5 px-6">Outstanding</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-6 text-indigo-500 dark:text-indigo-400 font-extrabold">
                      {order.orderNumber}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-950 dark:text-slate-100">{order.patientId?.name}</span>
                        <span className="text-[10px] text-slate-400">{order.patientId?.phone}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                      <div className="flex flex-col gap-0.5 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Book: {new Date(order.bookingDate).toLocaleDateString()}
                        </span>
                        <span>Del: {new Date(order.deliveryDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400 max-w-[180px]">
                      <div className="flex flex-col gap-0.5 text-xs truncate">
                        {order.lenses && <span className="truncate">L: {order.lenses}</span>}
                        {order.frame && <span className="truncate text-[10px] text-slate-400">F: {order.frame}</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-bold">{currencySymbol}{order.financials?.amount}</span>
                        <span className={`text-[10px] font-bold ${order.financials?.balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                          Bal: {currencySymbol}{order.financials?.balance}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[9px] font-bold
                          ${order.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-600' :
                            order.status === 'Ordered' ? 'bg-blue-500/10 text-blue-600' :
                            order.status === 'In Lab' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-slate-500/10 text-slate-600'}
                        `}>
                          {order.status}
                        </span>
                        <span className={`inline-flex items-center w-fit px-2 py-0.5 rounded-full text-[9px] font-bold
                          ${order.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-600' :
                            order.paymentStatus === 'Partial' ? 'bg-amber-500/10 text-amber-600' :
                            'bg-red-500/10 text-red-600'}
                        `}>
                          {order.paymentStatus}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex gap-1.5">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 !p-0 flex items-center justify-center cursor-pointer"
                          onClick={() => {
                            setSelectedOrder(order);
                            setReceiptOpen(true);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Link href={`/dashboard/orders/edit/${order._id}`}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-8 !p-0 flex items-center justify-center cursor-pointer border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 !p-0 flex items-center justify-center cursor-pointer border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => handleDelete(order._id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Receipt Modal */}
      {receiptOpen && selectedOrder && (
        <OrderReceipt 
          order={selectedOrder}
          onClose={() => {
            setReceiptOpen(false);
            setSelectedOrder(null);
            // Clear URL search params if highlighted
            if (highlightOrderId) {
              router.push('/dashboard/orders');
            }
          }}
        />
      )}

    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <OrdersListContent />
    </Suspense>
  );
}
