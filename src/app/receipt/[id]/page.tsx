'use client';

import React, { useState, useEffect } from 'react';
import { Printer, Eye, Calendar, User, Phone, MapPin } from 'lucide-react';
import Button from '@/components/ui/Button';

interface PublicReceiptProps {
  params: Promise<{ id: string }>;
}

export default function PublicReceiptPage({ params }: PublicReceiptProps) {
  const { id } = React.use(params);
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchReceipt() {
      try {
        const res = await fetch(`/api/receipt/${id}`);
        if (!res.ok) {
          throw new Error('Receipt not found or invalid link');
        }
        const data = await res.json();
        setOrder(data.order);
      } catch (err: any) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchReceipt();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <p className="text-sm font-semibold animate-pulse">Loading Invoice Receipt...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-4 px-4 text-center">
        <div className="h-14 w-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-800">Invalid Shareable Link</h1>
        <p className="text-sm text-slate-500 max-w-sm">{error || 'This receipt link is invalid or expired.'}</p>
      </div>
    );
  }

  const shop = order.shopId || {};
  const patient = order.patientId || {};
  const currencySymbol = shop.currency === 'USD' ? '$' : shop.currency === 'EUR' ? '€' : '₹';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 flex flex-col items-center gap-6 no-print">
      
      {/* Floating print banner */}
      <div className="w-full max-w-[650px] bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-sm text-slate-800">Malhotra Opticals Receipt</h2>
          <p className="text-xs text-slate-400">Order: {order.orderNumber}</p>
        </div>
        <Button 
          variant="primary" 
          onClick={handlePrint}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer flex items-center px-4 py-2"
        >
          <Printer className="w-4 h-4 mr-1.5" />
          Print / Save PDF
        </Button>
      </div>

      {/* Malhotra Opticals Physical Receipt Replica Card */}
      <div id="print-area" className="print-area w-full max-w-[650px] p-6 bg-white border border-blue-200 rounded-lg text-slate-900 shadow-md font-sans h-fit flex-shrink-0">
        
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-area, #print-area * {
              visibility: visible;
            }
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              border: none !important;
              box-shadow: none !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }
        `}</style>

        {/* Malhotra Opticals Header */}
        <div className="flex justify-between items-start border-b-2 border-blue-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-14 w-14 border-2 border-blue-900 text-blue-900 rounded-lg flex flex-col items-center justify-center relative overflow-hidden font-bold">
              <div className="w-8 h-4 border-2 border-blue-900 rounded-full flex items-center justify-center">
                <div className="w-2.5 h-2.5 bg-blue-900 rounded-full"></div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-black text-blue-900 tracking-wide uppercase leading-none">MALHOTRA</h2>
              <h3 className="text-base font-bold text-blue-800 tracking-widest uppercase">Opticals</h3>
            </div>
          </div>

          <div className="text-right text-[10px] font-semibold text-blue-900 max-w-[250px] space-y-0.5 leading-tight">
            <p className="font-bold">{shop.address || '1655, Multani Mohalla, Behind NDPL Office, Rani Bagh, Delhi-110034'}</p>
            <p>Mob: {shop.phone || '9811075234'}</p>
            {shop.email && <p>Email: {shop.email}</p>}
          </div>
        </div>

        {/* Patient Metadata Grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-4 text-xs text-blue-900 border-b border-blue-100 pb-4">
          <div className="space-y-1.5 font-semibold">
            <p><span className="text-blue-600 font-medium">Name:</span> <span className="text-slate-900 font-bold">{patient.name}</span></p>
            <p><span className="text-blue-600 font-medium">Age:</span> <span className="text-slate-900 font-bold">{patient.age || '--'}</span></p>
            <p><span className="text-blue-600 font-medium">Gender:</span> <span className="text-slate-900 font-bold">{patient.gender || '--'}</span></p>
            <p><span className="text-blue-600 font-medium">Address:</span> <span className="text-slate-900 font-bold truncate max-w-[200px] inline-block align-bottom">{patient.address || '--'}</span></p>
            <p><span className="text-blue-600 font-medium">Ph:</span> <span className="text-slate-900 font-bold">{patient.phone || '--'}</span></p>
          </div>

          <div className="space-y-1.5 font-semibold text-right sm:text-left">
            <p><span className="text-blue-600 font-medium">Code:</span> <span className="text-slate-900 font-bold">{patient.code || '--'}</span></p>
            <p><span className="text-blue-600 font-medium">Order / Booking No:</span> <span className="text-slate-900 font-bold">{order.orderNumber}</span></p>
            <p><span className="text-blue-600 font-medium">Booking Date:</span> <span className="text-slate-900 font-bold">{order.bookingDate ? new Date(order.bookingDate).toLocaleDateString() : '--'}</span></p>
            <p><span className="text-blue-600 font-medium">Delivery Date:</span> <span className="text-slate-900 font-bold">{order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '--'}</span></p>
            {order.optometrist && <p><span className="text-blue-600 font-medium">Optometrist:</span> <span className="text-slate-900 font-bold">{order.optometrist}</span></p>}
          </div>
        </div>

        {/* Malhotra Ocular prescription grid */}
        <div className="mt-5 space-y-4">
          <h4 className="text-xs font-extrabold text-blue-900 uppercase tracking-widest text-center border-y border-blue-900 py-1.5">Prescription Matrix</h4>
          
          <table className="w-full border border-blue-900 text-center text-xs font-semibold text-blue-900">
            <thead>
              <tr className="bg-blue-50 border-b border-blue-900">
                <th className="py-2 px-3 border-r border-blue-900">EYE</th>
                <th className="py-2 px-3 border-r border-blue-900">SPH</th>
                <th className="py-2 px-3 border-r border-blue-900">CYL</th>
                <th className="py-2 px-3 border-r border-blue-900">AXIS</th>
                <th className="py-2 px-3">VSN (Vision)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-blue-900">
                <td className="py-2 px-3 border-r border-blue-900 font-bold bg-blue-50/30">RIGHT (OD)</td>
                <td className="py-2 px-3 border-r border-blue-900 text-slate-900 font-bold">{order.prescription?.right?.sph || '--'}</td>
                <td className="py-2 px-3 border-r border-blue-900 text-slate-900 font-bold">{order.prescription?.right?.cyl || '--'}</td>
                <td className="py-2 px-3 border-r border-blue-900 text-slate-900 font-bold">{order.prescription?.right?.axis || '--'}</td>
                <td className="py-2 px-3 text-slate-900 font-bold">{order.prescription?.right?.vsn || '--'}</td>
              </tr>
              <tr className="border-b border-blue-900">
                <td className="py-2 px-3 border-r border-blue-900 font-bold bg-blue-50/30">LEFT (OS)</td>
                <td className="py-2 px-3 border-r border-blue-900 text-slate-900 font-bold">{order.prescription?.left?.sph || '--'}</td>
                <td className="py-2 px-3 border-r border-blue-900 text-slate-900 font-bold">{order.prescription?.left?.cyl || '--'}</td>
                <td className="py-2 px-3 border-r border-blue-900 text-slate-900 font-bold">{order.prescription?.left?.axis || '--'}</td>
                <td className="py-2 px-3 text-slate-900 font-bold">{order.prescription?.left?.vsn || '--'}</td>
              </tr>
              <tr>
                <td className="py-2 px-3 border-r border-blue-900 font-bold bg-blue-50/30">ADD (Near)</td>
                <td className="py-2 px-3 border-r border-blue-900 text-slate-900 font-bold">{order.prescription?.right?.add ? `R.E. ${order.prescription.right.add}` : '--'}</td>
                <td className="py-2 px-3 border-r border-blue-900 text-slate-900 font-bold">{order.prescription?.left?.add ? `L.E. ${order.prescription.left.add}` : '--'}</td>
                <td className="py-2 px-3 border-r border-blue-900 text-slate-400 font-bold">-</td>
                <td className="py-2 px-3 text-slate-400 font-bold">-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Frame details, lens details, IPD parameters */}
        <div className="grid grid-cols-2 gap-4 mt-5 border-t border-blue-100 pt-4 text-xs font-semibold text-blue-900">
          <div className="space-y-2">
            <p><span className="text-blue-600 font-medium">Shape Change:</span> <span className="text-slate-900 font-bold">{order.shapeChange || 'No'}</span></p>
            <p><span className="text-blue-600 font-medium">Contact Lens:</span> <span className="text-slate-900 font-bold">{order.contactLens || 'No'}</span></p>
            <p><span className="text-blue-600 font-medium">Pending status:</span> <span className="text-slate-900 font-bold">{order.pendingWork || 'None'}</span></p>
            <p><span className="text-blue-600 font-medium">I.P.D. Distance:</span> <span className="text-slate-900 font-bold">{order.ipd || '--'}</span></p>
          </div>
          <div className="space-y-2">
            <p><span className="text-blue-600 font-medium">FRAME:</span> <span className="text-slate-900 font-bold">{order.frame || '--'}</span></p>
            <p><span className="text-blue-600 font-medium">LENSES:</span> <span className="text-slate-900 font-bold">{order.lenses || '--'}</span></p>
          </div>
        </div>

        {/* Financial Details (Amount, Advance, Balance) & Sign */}
        <div className="mt-6 border-t-2 border-blue-900 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-blue-900">
          
          <div className="space-y-1.5 text-xs font-bold">
            <div className="flex justify-between max-w-[200px]">
              <span className="text-blue-600">AMOUNT:</span>
              <span className="text-slate-900">{currencySymbol}{order.financials?.amount || 0}</span>
            </div>
            <div className="flex justify-between max-w-[200px]">
              <span className="text-blue-600">ADVANCE:</span>
              <span className="text-emerald-600">{currencySymbol}{order.financials?.advance || 0}</span>
            </div>
            <div className="flex justify-between max-w-[200px] border-t border-blue-200 pt-1 text-sm font-black">
              <span>BALANCE:</span>
              <span className={order.financials?.balance > 0 ? 'text-red-500' : 'text-emerald-600'}>
                {currencySymbol}{order.financials?.balance || 0}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-end items-end pt-4 sm:pt-0">
            <div className="w-[180px] border-b border-blue-900 text-center pb-1 text-[11px] font-bold text-slate-500">
              {order.paymentStatus === 'Paid' ? 'PAID & CONFIRMED' : ''}
            </div>
            <div className="text-[9px] font-semibold text-blue-900 mt-1 mr-4">Cash Paid Signature</div>
          </div>

        </div>

        <div className="text-center text-[9px] text-blue-900/60 mt-8 font-semibold tracking-wider uppercase">
          Thank you for choosing Malhotra Opticals!
        </div>

      </div>

    </div>
  );
}
