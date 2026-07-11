'use client';

import React from 'react';
import { 
  Printer, 
  MessageCircle, 
  X, 
  Calendar, 
  User, 
  Layers, 
  Phone,
  Eye
} from 'lucide-react';
import Button from '@/components/ui/Button';

interface OrderReceiptProps {
  order: any;
  onClose: () => void;
}

export default function OrderReceipt({ order, onClose }: OrderReceiptProps) {
  const shop = order.shopId || {};
  const patient = order.patientId || {};
  const currencySymbol = shop.currency === 'USD' ? '$' : shop.currency === 'EUR' ? '€' : '₹';

  const handlePrint = () => {
    window.print();
  };

  const getSubstitutedMessage = (template: string) => {
    if (!template) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const receiptUrl = `${origin}/receipt/${order._id}`;
    return template
      .replace(/{patientName}/g, patient.name || '')
      .replace(/{orderNumber}/g, order.orderNumber || '')
      .replace(/{totalAmount}/g, `${currencySymbol}${order.financials?.amount || 0}`)
      .replace(/{advanceAmount}/g, `${currencySymbol}${order.financials?.advance || 0}`)
      .replace(/{balanceAmount}/g, `${currencySymbol}${order.financials?.balance || 0}`)
      .replace(/{deliveryDate}/g, order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '')
      .replace(/{shopName}/g, shop.name || '')
      .replace(/{receiptUrl}/g, receiptUrl);
  };

  const sendWhatsApp = (type: 'order' | 'ready' | 'balance') => {
    if (!patient.phone) return;

    let template = '';
    if (type === 'ready') {
      template = shop.whatsappTemplateReady || 'Hello {patientName}, your glasses/lenses for order {orderNumber} are ready for pickup at {shopName}. Remaining Balance: {balanceAmount}. View: {receiptUrl}';
    } else if (type === 'balance') {
      template = shop.whatsappTemplateBalance || 'Hello {patientName}, this is a friendly reminder from {shopName} regarding your pending balance of {balanceAmount} for order {orderNumber}. View: {receiptUrl}';
    } else {
      template = shop.whatsappTemplateOrder || 'Hello {patientName}, your order {orderNumber} has been booked at {shopName}. Total: {totalAmount}, Advance: {advanceAmount}, Balance: {balanceAmount}. View: {receiptUrl}';
    }

    const message = getSubstitutedMessage(template);
    // Sanitize phone number (strip letters/symbols, ensure prefix)
    let sanitizedPhone = patient.phone.replace(/[^0-9]/g, '');
    if (sanitizedPhone.length === 10) {
      sanitizedPhone = '91' + sanitizedPhone; // Default to India country code
    }

    const url = `https://wa.me/${sanitizedPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-up">
        
        {/* Actions Header */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl gap-3 no-print">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm sm:text-base">Prescription & Receipt Receipt</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrint}
              className="cursor-pointer font-bold text-xs"
            >
              <Printer className="w-4 h-4 mr-1.5" />
              Print Receipt
            </Button>
            <div className="relative group">
              <Button 
                variant="success" 
                size="sm" 
                className="cursor-pointer font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white flex items-center"
              >
                <MessageCircle className="w-4 h-4 mr-1.5" />
                Notify WhatsApp
              </Button>
              <div className="absolute right-0 top-full pt-1.5 hidden group-hover:block z-50 w-44">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-2 font-semibold text-xs space-y-1">
                  <button 
                    onClick={() => sendWhatsApp('order')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-slate-700 dark:text-slate-200"
                  >
                    Order Booked Msg
                  </button>
                  <button 
                    onClick={() => sendWhatsApp('ready')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-slate-700 dark:text-slate-200"
                  >
                    Glasses Ready Msg
                  </button>
                  <button 
                    onClick={() => sendWhatsApp('balance')}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-slate-700 dark:text-slate-200"
                  >
                    Balance Reminder
                  </button>
                </div>
              </div>
            </div>
            <button 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer ml-1 p-1"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Receipt Viewport */}
        <div className="p-8 overflow-y-auto flex justify-center items-start bg-slate-100 dark:bg-slate-950/40">
          
          {/* Malhotra Opticals Physical Replica Card */}
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
                {/* Visual Eye Logo Representation */}
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

              {/* Shop contact header details */}
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
              
              {/* Financial values */}
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

              {/* Cash Paid signature acknowledgement */}
              <div className="flex flex-col justify-end items-end pt-4 sm:pt-0">
                <div className="w-[180px] border-b border-blue-900 text-center pb-1 text-[11px] font-bold text-slate-500">
                  {order.paymentStatus === 'Paid' ? 'PAID & CONFIRMED' : ''}
                </div>
                <div className="text-[9px] font-semibold text-blue-900 mt-1 mr-4">Cash Paid Signature</div>
              </div>

            </div>

            {/* Receipt Footer */}
            <div className="text-center text-[9px] text-blue-900/60 mt-8 font-semibold tracking-wider uppercase">
              Thank you for choosing Malhotra Opticals!
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
