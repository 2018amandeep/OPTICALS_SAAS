'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Truck, 
  AlertCircle, 
  ArrowUpRight,
  MessageCircle,
  CheckCircle,
  Eye,
  Plus
} from 'lucide-react';
import Button from '@/components/ui/Button';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [activeTab, setActiveTab] = useState<'overview' | 'footfall' | 'inventory'>('overview');

  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'info' }>({ 
    show: false, 
    message: '', 
    type: 'success' 
  });

  const triggerToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
      
      // Get currency symbol from shop
      const shopRes = await fetch('/api/auth/me');
      if (shopRes.ok) {
        const shopData = await shopRes.json();
        if (shopData.shop?.currency === 'USD') setCurrencySymbol('$');
        else if (shopData.shop?.currency === 'EUR') setCurrencySymbol('€');
        else setCurrencySymbol('₹');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const sendWhatsAppReminder = async (order: any, type: 'ready' | 'balance') => {
    if (!order.patientId?.phone) return;
    
    let message = '';
    const patientName = order.patientId.name;
    const orderNumber = order.orderNumber;
    const balanceAmount = `${currencySymbol}${order.financials.balance}`;
    const shopName = order.shopId?.name || 'our shop';

    if (type === 'ready') {
      message = `Hello ${patientName}, your glasses/lenses for order ${orderNumber} are ready for pickup at ${shopName}. Remaining Balance to pay: ${balanceAmount}. See you soon!`;
    } else {
      message = `Hello ${patientName}, this is a friendly reminder from ${shopName} regarding your pending balance of ${balanceAmount} for order ${orderNumber}. Please make the payment at your convenience. Thank you!`;
    }

    let phone = order.patientId.phone.replace(/[^0-9]/g, '');
    if (phone.length === 10) {
      phone = '91' + phone;
    }

    try {
      const response = await fetch('/api/whatsapp/send-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phone, 
          message,
          recipientName: patientName,
          type: type === 'ready' ? 'ready_msg' : 'balance_msg'
        })
      });
      
      if (response.ok) {
        triggerToast('Reminder notification sent successfully via background WhatsApp Web service!', 'success');
        return;
      }
    } catch (err) {
      console.log('Background WhatsApp service offline or failed, falling back to browser tab link.');
    }

    triggerToast('Service offline. Redirecting to WhatsApp web...', 'info');
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    setTimeout(() => {
      window.open(url, '_blank');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-center gap-2">
        <AlertCircle className="w-5 h-5" />
        {error}
      </div>
    );
  }

  const { metrics, todayDeliveries, pendingBalances, trend, analytics = {} } = stats;
  const { hourlyFootfall = [], weekdayFootfall = [], topFrames = [], topLenses = [], clinical = {} } = analytics;

  // Custom SVG chart generation
  const maxSales = Math.max(...trend.map((t: any) => t.sales), 1000);
  const chartHeight = 160;
  const chartWidth = 500;
  const points = trend.map((t: any, index: number) => {
    const x = (index / (trend.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - (t.sales / maxSales) * (chartHeight - 40) - 20;
    return { x, y, day: t.day, sales: t.sales };
  });
  
  const polylinePoints = points.map((p: any) => `${p.x},${p.y}`).join(' ');
  const areaPoints = `${points[0].x},${chartHeight - 20} ${polylinePoints} ${points[points.length - 1].x},${chartHeight - 20}`;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Header and Quick action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Real-time statistics and delivery management</p>
        </div>
        <Link href="/dashboard/orders/new">
          <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Order / Prescription
          </Button>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Sales</p>
              <h3 className="text-2xl font-extrabold mt-1">{currencySymbol}{metrics.totalSales.toLocaleString()}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 dark:text-indigo-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs font-semibold text-slate-400 flex items-center gap-1">
            <span>Overall business turnover</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Collections</p>
              <h3 className="text-2xl font-extrabold mt-1 text-emerald-600 dark:text-emerald-400">{currencySymbol}{metrics.totalCollections.toLocaleString()}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs font-semibold text-slate-400 flex items-center gap-1">
            <span>Collected advance & paid amounts</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Outstanding Balance</p>
              <h3 className="text-2xl font-extrabold mt-1 text-amber-600 dark:text-amber-400">{currencySymbol}{metrics.totalOutstanding.toLocaleString()}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs font-semibold text-slate-400 flex items-center gap-1">
            <span>{metrics.pendingBalancesCount} orders awaiting final payments</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today's Deliveries</p>
              <h3 className="text-2xl font-extrabold mt-1 text-blue-600 dark:text-blue-400">{metrics.todayDeliveriesCount}</h3>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 dark:text-blue-400">
              <Truck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs font-semibold text-slate-400 flex items-center gap-1">
            <span>Orders scheduled for delivery today</span>
          </div>
        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 no-print overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Overview & Tasks
        </button>
        <button
          onClick={() => setActiveTab('footfall')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
            activeTab === 'footfall'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Footfall & Traffic
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all duration-200 whitespace-nowrap cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
              : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          Inventory & Clinical Insights
        </button>
      </div>

      {/* Tab 1: Overview & Tasks */}
      {activeTab === 'overview' && (
        <>
          {/* Main Grid: Visual Trend Chart and Today's Deliveries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Trend Chart (Left 2 columns) */}
            <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-base">Weekly Sales Trend</h3>
                  <span className="text-xs font-semibold text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                    Last 7 Days
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-6">Booking trends based on amount of orders placed daily</p>
              </div>
              
              {/* Custom SVG Line Chart */}
              <div className="w-full flex justify-center py-4">
                <svg 
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
                  className="w-full overflow-visible max-w-xl text-slate-300 dark:text-slate-700"
                >
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2"/>
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
                    </linearGradient>
                  </defs>

                  {/* Grid Lines */}
                  <line x1="20" y1={chartHeight - 20} x2={chartWidth - 20} y2={chartHeight - 20} stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" />
                  <line x1="20" y1={chartHeight - 70} x2={chartWidth - 20} y2={chartHeight - 70} stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
                  <line x1="20" y1={chartHeight - 120} x2={chartWidth - 20} y2={chartHeight - 120} stroke="currentColor" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.5" />
                  
                  {/* Area Under Curve */}
                  <polygon points={areaPoints} fill="url(#chartGrad)" />

                  {/* Connecting Line */}
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={polylinePoints}
                  />

                  {/* Tooltip circles and text labels */}
                  {points.map((p: any, idx: number) => (
                    <g key={idx} className="group cursor-pointer">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r="4.5"
                        fill="#4f46e5"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        className="transition-transform duration-200 hover:scale-150"
                      />
                      {/* Tooltip details showing on hover */}
                      <text
                        x={p.x}
                        y={p.y - 12}
                        textAnchor="middle"
                        className="text-[9px] font-bold fill-indigo-600 dark:fill-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        {currencySymbol}{p.sales}
                      </text>
                      {/* X Axis Labels */}
                      <text
                        x={p.x}
                        y={chartHeight - 4}
                        textAnchor="middle"
                        className="text-[10px] font-semibold fill-slate-400 dark:fill-slate-500"
                      >
                        {p.day}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            {/* Deliveries Widget (Right 1 column) */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-base">Today's Deliveries</h3>
                  <span className="text-xs bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 px-2 py-0.5 rounded-full font-bold">
                    {todayDeliveries.filter((o: any) => o.status !== 'Delivered').length} Pending
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-6">Orders scheduled for collection/delivery today</p>
              </div>

              <div className="flex-1 space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {todayDeliveries.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle className="w-10 h-10 text-emerald-500/30 mb-2" />
                    <p className="text-xs font-semibold text-slate-400">All caught up for today!</p>
                  </div>
                ) : (
                  todayDeliveries.map((order: any) => (
                    <div key={order._id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between gap-3 hover:border-slate-200 dark:hover:border-slate-800 transition-colors">
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate leading-none mb-1">{order.patientId?.name}</p>
                        <p className="text-[10px] text-slate-500 font-medium truncate mb-1.5">{order.orderNumber}</p>
                        <div className="flex gap-1.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                            ${order.status === 'Delivered' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                              order.status === 'Ready' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                              'bg-amber-500/10 text-amber-600 dark:text-amber-400'}
                          `}>
                            {order.status}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full
                            ${order.paymentStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}
                          `}>
                            {order.paymentStatus}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Link href={`/dashboard/orders?id=${order._id}`}>
                          <Button variant="outline" size="sm" className="h-8 w-8 !p-0 flex items-center justify-center cursor-pointer">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        </Link>
                        {order.status !== 'Ready' && order.status !== 'Delivered' && (
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="h-8 text-[10px] px-2.5 cursor-pointer bg-indigo-600 hover:bg-indigo-700 text-white"
                            onClick={() => handleUpdateStatus(order._id, 'Ready')}
                          >
                            Set Ready
                          </Button>
                        )}
                        {order.status === 'Ready' && (
                          <Button 
                            variant="success" 
                            size="sm" 
                            className="h-8 text-[10px] px-2.5 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => handleUpdateStatus(order._id, 'Delivered')}
                          >
                            Deliver
                          </Button>
                        )}
                        {order.status === 'Delivered' && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 px-2 py-1 bg-emerald-500/10 rounded-lg">
                            ✓ Delivered
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Row 3: Pending Balances Widget */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
              <div>
                <h3 className="font-bold text-base">Pending Collections</h3>
                <p className="text-xs text-slate-400 mt-0.5">Customers with outstanding balance amounts on prescriptions</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-400 px-3 py-1 rounded-lg">
                Total Outstanding: <span className="text-red-500 font-extrabold">{currencySymbol}{metrics.totalOutstanding.toLocaleString()}</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              {pendingBalances.length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-medium text-xs">
                  No pending collections. Outstanding balances clear!
                </div>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 font-bold">
                      <th className="py-3 px-4">Patient Details</th>
                      <th className="py-3 px-4">Order Number</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Order Total</th>
                      <th className="py-3 px-4">Advance Paid</th>
                      <th className="py-3 px-4">Pending Balance</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {pendingBalances.map((order: any) => (
                      <tr key={order._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-bold">{order.patientId?.name}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{order.patientId?.phone}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-500 dark:text-slate-400">{order.orderNumber}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold
                            ${order.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                              order.status === 'Ordered' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                              order.status === 'In Lab' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                              'bg-slate-500/10 text-slate-600 dark:text-slate-400'}
                          `}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold">{currencySymbol}{order.financials.amount}</td>
                        <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">{currencySymbol}{order.financials.advance}</td>
                        <td className="py-3.5 px-4 font-extrabold text-red-500">{currencySymbol}{order.financials.balance}</td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex gap-1.5">
                            <Link href={`/dashboard/orders?id=${order._id}`}>
                              <Button variant="outline" size="sm" className="h-8 w-8 !p-0 flex items-center justify-center cursor-pointer">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            </Link>
                            {order.status === 'Ready' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 !p-0 px-2 cursor-pointer border-emerald-500 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                                onClick={() => sendWhatsAppReminder(order, 'ready')}
                              >
                                <MessageCircle className="w-3.5 h-3.5 mr-1" />
                                Ready
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 !p-0 px-2 cursor-pointer border-amber-500 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/20"
                              onClick={() => sendWhatsAppReminder(order, 'balance')}
                            >
                              <MessageCircle className="w-3.5 h-3.5 mr-1" />
                              Balance
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Footfall & Traffic Density */}
      {activeTab === 'footfall' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
          {/* Peak Hours Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-base">Busiest Hours of the Day</h3>
              <p className="text-xs text-slate-400 mt-0.5">Peak traffic distribution based on active order bookings (Asia/Kolkata local time)</p>
            </div>
            
            <div className="h-64 flex items-end justify-between gap-1.5 pt-6 border-b border-slate-100 dark:border-slate-800/80">
              {(() => {
                const dayHours = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]; // standard shop opening hours
                const maxHourVal = Math.max(...dayHours.map(h => hourlyFootfall[h] || 0), 1);
                return dayHours.map(h => {
                  const val = hourlyFootfall[h] || 0;
                  const heightPct = (val / maxHourVal) * 100;
                  const displayHour = h > 12 ? `${h - 12} PM` : h === 12 ? '12 PM' : `${h} AM`;
                  return (
                    <div key={h} className="flex-1 flex flex-col items-center group h-full justify-end">
                      <div className="relative w-full flex justify-center">
                        <span className="absolute -top-7 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-indigo-50 dark:bg-indigo-950/60 px-1 rounded shadow-sm z-10">
                          {val} visits
                        </span>
                      </div>
                      <div 
                        style={{ height: `${Math.max(heightPct, 4)}%` }} 
                        className={`w-full rounded-t-md transition-all duration-305 group-hover:bg-indigo-500
                          ${val > 0 ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-slate-100 dark:bg-slate-800/60'}
                        `}
                      />
                      <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 mt-2 truncate w-full text-center">
                        {displayHour}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 font-medium">
              <span>Morning Shift (9 AM - 1 PM)</span>
              <span>Evening Rush (5 PM - 9 PM)</span>
            </div>
          </div>

          {/* Busiest Weekdays Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="font-bold text-base">Weekly Footfall Density</h3>
              <p className="text-xs text-slate-400 mt-0.5">Booking density by day of the week to manage optometrist rosters</p>
            </div>

            <div className="space-y-3.5 pt-2">
              {(() => {
                const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                const maxDayVal = Math.max(...weekdayFootfall, 1);
                return days.map((dayName, idx) => {
                  const val = weekdayFootfall[idx] || 0;
                  const widthPct = (val / maxDayVal) * 100;
                  return (
                    <div key={dayName} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-600 dark:text-slate-350">{dayName}</span>
                        <span className="text-indigo-600 dark:text-indigo-400">{val} orders booked</span>
                      </div>
                      <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800/60 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${Math.max(widthPct, 1)}%` }}
                          className={`h-full rounded-full transition-all duration-500 ${
                            idx === 0 || idx === 6 
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-500' // highlights weekends
                              : 'bg-gradient-to-r from-indigo-600 to-indigo-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Inventory & Clinical Diagnostics */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 no-print">
          {/* Clinical Insights (Doctor's Corner) */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                🩺 Clinical Patient Demographics
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Ocular diagnosis breakdown among patient bookings (total evaluated eyes: {clinical.totalEyes || 0})</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Card Myopia */}
              <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Myopia</span>
                  <span className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40 px-1.5 py-0.5 rounded animate-pulse">Short-sighted</span>
                </div>
                <h4 className="text-2xl font-black mt-2 text-indigo-600 dark:text-indigo-400">
                  {clinical.totalEyes ? Math.round((clinical.myopia / clinical.totalEyes) * 100) : 0}%
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">{clinical.myopia || 0} eyes with minus power</p>
              </div>

              {/* Card Hyperopia */}
              <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Hyperopia</span>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">Far-sighted</span>
                </div>
                <h4 className="text-2xl font-black mt-2 text-emerald-600 dark:text-emerald-400">
                  {clinical.totalEyes ? Math.round((clinical.hyperopia / clinical.totalEyes) * 100) : 0}%
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">{clinical.hyperopia || 0} eyes with plus power</p>
              </div>

              {/* Card Astigmatism */}
              <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Astigmatism</span>
                  <span className="text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">Cylindrical</span>
                </div>
                <h4 className="text-2xl font-black mt-2 text-amber-600 dark:text-amber-400">
                  {clinical.totalEyes ? Math.round((clinical.astigmatism / clinical.totalEyes) * 100) : 0}% 
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">{clinical.astigmatism || 0} eyes have CYL power</p>
              </div>

              {/* Card Presbyopia */}
              <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Presbyopia</span>
                  <span className="text-xs font-bold text-purple-500 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded">Reading Add</span>
                </div>
                <h4 className="text-2xl font-black mt-2 text-purple-600 dark:text-purple-400">
                  {clinical.totalEyes ? Math.round((clinical.presbyopia / clinical.totalEyes) * 100) : 0}%
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-1">{clinical.presbyopia || 0} eyes require reading addition</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl text-[11px] font-medium leading-relaxed text-blue-800 dark:text-blue-300">
              💡 <strong>Optometrist Stocking Guideline:</strong> Higher Myopia percentage suggests maintaining single-vision stock lenses of negative powers. A significant Presbyopia percentage means bifocal and progressive lenses (Crizal, Varilux) should be prioritized.
            </div>
          </div>

          {/* Top Products Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            {/* Top Frames */}
            <div className="space-y-3">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">🔥 Top Selling Frames</h3>
              <div className="space-y-2">
                {topFrames.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold py-2">No frames sold yet.</p>
                ) : (
                  topFrames.map((item: any, idx: number) => (
                    <div key={item.name} className="flex justify-between items-center text-xs font-bold bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-[10px] text-indigo-500 font-black">
                          {idx + 1}
                        </span>
                        <span className="text-slate-700 dark:text-slate-350 truncate max-w-[200px]">{item.name}</span>
                      </div>
                      <span className="text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 px-2 py-0.5 rounded-lg">{item.count} units sold</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Lenses */}
            <div className="space-y-3 pt-2">
              <h3 className="font-bold text-base text-slate-800 dark:text-slate-100 font-sans">🔥 Top Selling Lenses</h3>
              <div className="space-y-2">
                {topLenses.length === 0 ? (
                  <p className="text-xs text-slate-400 font-semibold py-2">No lenses sold yet.</p>
                ) : (
                  topLenses.map((item: any, idx: number) => (
                    <div key={item.name} className="flex justify-between items-center text-xs font-bold bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-[10px] text-emerald-500 font-black">
                          {idx + 1}
                        </span>
                        <span className="text-slate-700 dark:text-slate-350 truncate max-w-[200px]">{item.name}</span>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-lg">{item.count} orders</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 text-white px-6 py-3 rounded-full shadow-2xl backdrop-blur-md border border-white/10 transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-600/95 border-emerald-500/20' : 'bg-blue-600/95 border-blue-500/20'}`}>
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          <span className="text-sm font-semibold tracking-wide">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
