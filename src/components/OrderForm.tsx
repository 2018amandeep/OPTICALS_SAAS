'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, UserPlus, Eye, Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

// Helper functions to generate dropdown options based on the prescription card
const generateSphOptions = () => {
  const options = [];
  // +10.00 down to +0.25
  for (let val = 10.00; val > 0; val -= 0.25) {
    options.push(`+${val.toFixed(2)}`);
  }
  options.push('0.00');
  // -0.25 down to -20.00
  for (let val = -0.25; val >= -20.00; val -= 0.25) {
    options.push(val.toFixed(2));
  }
  return options;
};

const generateCylOptions = () => {
  const options = [];
  options.push('0.00');
  for (let val = -0.25; val >= -6.00; val -= 0.25) {
    options.push(val.toFixed(2));
  }
  return options;
};

const generateAxisOptions = () => {
  const options = [];
  for (let val = 0; val <= 180; val++) {
    options.push(String(val));
  }
  return options;
};

const visOptions = ['6/5', '6/6', '6/9', '6/12', '6/18', '6/24', '6/36', '6/60'];

const generateAddOptions = () => {
  const options = [];
  for (let val = 0.50; val <= 4.00; val += 0.25) {
    options.push(`+${val.toFixed(2)}`);
  }
  return options;
};

const SPH_OPTIONS = generateSphOptions();
const CYL_OPTIONS = generateCylOptions();
const AXIS_OPTIONS = generateAxisOptions();
const ADD_OPTIONS = generateAddOptions();

interface OrderFormProps {
  orderId?: string; // If provided, we are in Edit mode
  prefilledPatientId?: string; // If provided, pre-select this patient
}

export default function OrderForm({ orderId, prefilledPatientId }: OrderFormProps) {
  const router = useRouter();
  const isEdit = !!orderId;

  // Data fetching states
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form Fields
  const [patientId, setPatientId] = useState('');
  const [patientHistory, setPatientHistory] = useState<any>(null);
  const [patientNotes, setPatientNotes] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [optometrist, setOptometrist] = useState('Dr. Malhotra');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().slice(0, 10));
  const [deliveryDate, setDeliveryDate] = useState('');
  
  // Prescriptions (Right Eye / Left Eye)
  const [sphOD, setSphOD] = useState('');
  const [cylOD, setCylOD] = useState('');
  const [axisOD, setAxisOD] = useState('');
  const [vsnOD, setVsnOD] = useState('');
  const [addOD, setAddOD] = useState('');
  
  const [sphOS, setSphOS] = useState('');
  const [cylOS, setCylOS] = useState('');
  const [axisOS, setAxisOS] = useState('');
  const [vsnOS, setVsnOS] = useState('');
  const [addOS, setAddOS] = useState('');
  
  // Frame, Lenses, IPD, and customization flags
  const [ipd, setIpd] = useState('');
  const [shapeChange, setShapeChange] = useState('');
  const [contactLens, setContactLens] = useState('');
  const [pendingWork, setPendingWork] = useState('');
  const [frame, setFrame] = useState('');
  const [lenses, setLenses] = useState('');
  
  // Financials
  const [amount, setAmount] = useState('0');
  const [advance, setAdvance] = useState('0');
  const [balance, setBalance] = useState(0);
  
  // Status
  const [status, setStatus] = useState('Ordered');
  const [notes, setNotes] = useState('');

  // Fetch initial patients and order data (if edit)
  useEffect(() => {
    async function init() {
      try {
        // Fetch patients list
        const patientsRes = await fetch('/api/patients');
        if (!patientsRes.ok) throw new Error('Failed to fetch patients list');
        const patientsData = await patientsRes.json();
        setPatients(patientsData.patients);

        if (prefilledPatientId) {
          setPatientId(prefilledPatientId);
        }

        // If in Edit Mode, fetch order details
        if (isEdit) {
          const orderRes = await fetch(`/api/orders/${orderId}`);
          if (!orderRes.ok) throw new Error('Order not found');
          const orderData = await orderRes.json();
          const order = orderData.order;

          setPatientId(order.patientId?._id || '');
          setOptometrist(order.optometrist || '');
          setBookingDate(new Date(order.bookingDate).toISOString().slice(0, 10));
          setDeliveryDate(new Date(order.deliveryDate).toISOString().slice(0, 10));
          
          // Prescriptions
          setSphOD(order.prescription?.right?.sph || '');
          setCylOD(order.prescription?.right?.cyl || '');
          setAxisOD(order.prescription?.right?.axis || '');
          setVsnOD(order.prescription?.right?.vsn || '');
          setAddOD(order.prescription?.right?.add || '');

          setSphOS(order.prescription?.left?.sph || '');
          setCylOS(order.prescription?.left?.cyl || '');
          setAxisOS(order.prescription?.left?.axis || '');
          setVsnOS(order.prescription?.left?.vsn || '');
          setAddOS(order.prescription?.left?.add || '');

          setIpd(order.ipd || '');
          setShapeChange(order.shapeChange || '');
          setContactLens(order.contactLens || '');
          setPendingWork(order.pendingWork || '');
          setFrame(order.frame || '');
          setLenses(order.lenses || '');

          // Financials
          setAmount(String(order.financials?.amount || 0));
          setAdvance(String(order.financials?.advance || 0));
          setBalance(order.financials?.balance || 0);

          setStatus(order.status || 'Ordered');
          setNotes(order.notes || '');
        }
      } catch (err: any) {
        setError(err.message || 'Error loading form data');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [orderId, isEdit, prefilledPatientId]);

  // Recalculate balance whenever amount or advance changes
  useEffect(() => {
    const amt = parseFloat(amount) || 0;
    const adv = parseFloat(advance) || 0;
    setBalance(Math.max(0, amt - adv));
  }, [amount, advance]);

  // Fetch patient history details when patientId is selected
  useEffect(() => {
    if (!patientId) {
      setPatientHistory(null);
      setPatientNotes('');
      return;
    }
    
    async function fetchPatientDetails() {
      setLoadingHistory(true);
      try {
        const res = await fetch(`/api/patients/${patientId}`);
        if (res.ok) {
          const data = await res.json();
          setPatientHistory(data);
          setPatientNotes(data.patient?.notes || '');
        }
      } catch (err) {
        console.error('Error fetching patient history:', err);
      } finally {
        setLoadingHistory(false);
      }
    }
    fetchPatientDetails();
  }, [patientId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!patientId) {
      setError('Please select a patient');
      setSubmitting(false);
      return;
    }

    if (!deliveryDate) {
      setError('Delivery date is required');
      setSubmitting(false);
      return;
    }

    // Client-side validation: SPH, CYL ranges
    const numericFields = [
      { val: sphOD, min: -20, max: 10, label: 'Right Eye SPH' },
      { val: cylOD, min: -6, max: 0, label: 'Right Eye CYL' },
      { val: sphOS, min: -20, max: 10, label: 'Left Eye SPH' },
      { val: cylOS, min: -6, max: 0, label: 'Left Eye CYL' }
    ];

    for (const f of numericFields) {
      if (f.val && f.val.trim() !== '') {
        const num = parseFloat(f.val);
        if (isNaN(num)) {
          setError(`${f.label} must be a valid decimal number (e.g. -1.25 or +2.00)`);
          setSubmitting(false);
          return;
        }
        if (num < f.min || num > f.max) {
          setError(`${f.label} must be between ${f.min} and ${f.max}`);
          setSubmitting(false);
          return;
        }
      }
    }

    // Client-side validation: ADD ranges
    const addFields = [
      { val: addOD, min: 0.5, max: 4.0, label: 'Right Eye ADD' },
      { val: addOS, min: 0.5, max: 4.0, label: 'Left Eye ADD' }
    ];

    for (const f of addFields) {
      if (f.val && f.val.trim() !== '') {
        const num = parseFloat(f.val);
        if (isNaN(num)) {
          setError(`${f.label} must be a valid decimal number (e.g. +1.50)`);
          setSubmitting(false);
          return;
        }
        if (num < f.min || num > f.max) {
          setError(`${f.label} must be between +${f.min.toFixed(2)} and +${f.max.toFixed(2)}`);
          setSubmitting(false);
          return;
        }
      }
    }

    // Client-side validation: AXIS (0 to 180)
    const axisFields = [
      { val: axisOD, label: 'Right Eye AXIS' },
      { val: axisOS, label: 'Left Eye AXIS' }
    ];

    for (const a of axisFields) {
      if (a.val && a.val.trim() !== '') {
        const num = parseInt(a.val, 10);
        if (isNaN(num) || num < 0 || num > 180) {
          setError(`${a.label} must be an integer between 0 and 180`);
          setSubmitting(false);
          return;
        }
      }
    }

    // Client-side validation: IPD (40mm to 80mm)
    if (ipd && ipd.trim() !== '') {
      const numbers = ipd.match(/\d+/g);
      if (!numbers) {
        setError('I.P.D. must contain numbers (e.g. 63mm or 60-64)');
        setSubmitting(false);
        return;
      }
      for (const n of numbers) {
        const num = parseInt(n, 10);
        if (num < 40 || num > 80) {
          setError('I.P.D. value must be between 40mm and 80mm');
          setSubmitting(false);
          return;
        }
      }
    }

    const payload = {
      patientId,
      optometrist,
      bookingDate: new Date(bookingDate),
      deliveryDate: new Date(deliveryDate),
      prescription: {
        right: { sph: sphOD, cyl: cylOD, axis: axisOD, vsn: vsnOD, add: addOD },
        left: { sph: sphOS, cyl: cylOS, axis: axisOS, vsn: vsnOS, add: addOS }
      },
      ipd,
      shapeChange,
      contactLens,
      pendingWork,
      frame,
      lenses,
      financials: {
        amount: parseFloat(amount) || 0,
        advance: parseFloat(advance) || 0,
      },
      status,
      notes
    };

    try {
      // Auto-save edited patient clinical history notes
      if (patientId && patientNotes !== (patientHistory?.patient?.notes || '')) {
        await fetch(`/api/patients/${patientId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: patientNotes })
        });
      }

      const url = isEdit ? `/api/orders/${orderId}` : '/api/orders';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save prescription');

      // Navigate to order detail view
      router.push(`/dashboard/orders?id=${data.order._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to save order');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto pb-12">
      
      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Card 1: Patient, Dates & Doctor */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Order Metadata</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <Select
              label="Select Patient *"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              options={[]}
              required
            >
              <option value="">-- Choose Patient --</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.phone}) {p.code ? `- [${p.code}]` : ''}
                </option>
              ))}
            </Select>
            <div className="mt-1.5 flex justify-end">
              <span 
                onClick={() => router.push('/dashboard/patients')}
                className="text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add patient first if not listed
              </span>
            </div>
          </div>

          <Input
            label="Optometrist"
            placeholder="Name of doctor"
            value={optometrist}
            onChange={(e) => setOptometrist(e.target.value)}
          />

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={[
              { value: 'Ordered', label: 'Ordered' },
              { value: 'In Lab', label: 'In Lab' },
              { value: 'Ready', label: 'Ready' },
              { value: 'Delivered', label: 'Delivered' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Booking Date *"
            type="date"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            required
          />
          <Input
            label="Delivery Date *"
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Card 1.5: Patient History and Clinical Notes */}
      {patientId && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Patient Clinical History</h3>
              <p className="text-[11px] text-slate-450 dark:text-slate-550">View past prescription records and manage clinical notes</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40">
              Active Patient Record
            </span>
          </div>

          {loadingHistory ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Doctor Notes / Clinical History */}
              <div className="lg:col-span-1 flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                  Medical History & Notes
                </label>
                <textarea
                  placeholder="Enter medical conditions, ocular history, allergies, system findings (e.g. Diabetic, Cataract RE, Complains of night glare...)"
                  value={patientNotes}
                  onChange={(e) => setPatientNotes(e.target.value)}
                  className="w-full flex-1 min-h-[140px] px-3 py-2 border rounded-lg text-sm bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
                />
                <span className="text-[10px] text-slate-400 font-medium">
                  Note: Edits here will automatically save to patient's clinical file upon submitting this order.
                </span>
              </div>

              {/* Past Prescriptions List */}
              <div className="lg:col-span-2 space-y-2.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide block">
                  Past Prescriptions & Orders History
                </label>
                
                <div className="overflow-x-auto max-h-[180px] border border-slate-100 dark:border-slate-800 rounded-lg">
                  {!patientHistory?.orders || patientHistory.orders.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 dark:text-slate-500 text-xs font-semibold">
                      No previous prescription records found for this patient.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs font-semibold">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Order No.</th>
                          <th className="py-2.5 px-3">Doctor</th>
                          <th className="py-2.5 px-3">R.E. (SPH/CYL/AXIS/ADD)</th>
                          <th className="py-2.5 px-3">L.E. (SPH/CYL/AXIS/ADD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {patientHistory.orders.map((prevOrder: any) => {
                          const r = prevOrder.prescription?.right || {};
                          const l = prevOrder.prescription?.left || {};
                          return (
                            <tr key={prevOrder._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                              <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                                {new Date(prevOrder.bookingDate).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 px-3 text-indigo-500 font-bold whitespace-nowrap">
                                {prevOrder.orderNumber}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                {prevOrder.optometrist || '--'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                                {`SPH: ${r.sph || '--'} | CYL: ${r.cyl || '--'} | AXIS: ${r.axis || '--'} ${r.add ? `| ADD: ${r.add}` : ''}`}
                              </td>
                              <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                                {`SPH: ${l.sph || '--'} | CYL: ${l.cyl || '--'} | AXIS: ${l.axis || '--'} ${l.add ? `| ADD: ${l.add}` : ''}`}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Card 2: Eye Prescription matrix */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Eye Prescription</h3>
          <span className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40">
            Malhotra Opticals Grid
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse border border-slate-100 dark:border-slate-800 text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                <th className="py-2.5 px-3 text-left">EYE</th>
                <th className="py-2.5 px-3">SPH</th>
                <th className="py-2.5 px-3">CYL</th>
                <th className="py-2.5 px-3">AXIS</th>
                <th className="py-2.5 px-3">VSN (Vision)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              <tr>
                <td className="py-3 px-3 text-left font-bold text-slate-700 dark:text-slate-300">RIGHT (OD)</td>
                <td className="py-2 px-2">
                  <select value={sphOD} onChange={(e) => setSphOD(e.target.value)} className="w-full px-2 py-1.5 text-center bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded outline-none focus:border-indigo-500 cursor-pointer">
                    <option value="">SPH</option>
                    {SPH_OPTIONS.map(opt => <option key={`od-sph-${opt}`} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td className="py-2 px-2">
                  <select value={cylOD} onChange={(e) => setCylOD(e.target.value)} className="w-full px-2 py-1.5 text-center bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded outline-none focus:border-indigo-500 cursor-pointer">
                    <option value="">CYL</option>
                    {CYL_OPTIONS.map(opt => <option key={`od-cyl-${opt}`} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td className="py-2 px-2">
                  <select value={axisOD} onChange={(e) => setAxisOD(e.target.value)} className="w-full px-2 py-1.5 text-center bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded outline-none focus:border-indigo-500 cursor-pointer">
                    <option value="">AXIS</option>
                    {AXIS_OPTIONS.map(opt => <option key={`od-axis-${opt}`} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td className="py-2 px-2">
                  <select value={vsnOD} onChange={(e) => setVsnOD(e.target.value)} className="w-full px-2 py-1.5 text-center bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded outline-none focus:border-indigo-500 cursor-pointer">
                    <option value="">VIS</option>
                    {visOptions.map(opt => <option key={`od-vis-${opt}`} value={opt}>{opt}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-left font-bold text-slate-700 dark:text-slate-300">LEFT (OS)</td>
                <td className="py-2 px-2">
                  <select value={sphOS} onChange={(e) => setSphOS(e.target.value)} className="w-full px-2 py-1.5 text-center bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded outline-none focus:border-indigo-500 cursor-pointer">
                    <option value="">SPH</option>
                    {SPH_OPTIONS.map(opt => <option key={`os-sph-${opt}`} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td className="py-2 px-2">
                  <select value={cylOS} onChange={(e) => setCylOS(e.target.value)} className="w-full px-2 py-1.5 text-center bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded outline-none focus:border-indigo-500 cursor-pointer">
                    <option value="">CYL</option>
                    {CYL_OPTIONS.map(opt => <option key={`os-cyl-${opt}`} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td className="py-2 px-2">
                  <select value={axisOS} onChange={(e) => setAxisOS(e.target.value)} className="w-full px-2 py-1.5 text-center bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded outline-none focus:border-indigo-500 cursor-pointer">
                    <option value="">AXIS</option>
                    {AXIS_OPTIONS.map(opt => <option key={`os-axis-${opt}`} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td className="py-2 px-2">
                  <select value={vsnOS} onChange={(e) => setVsnOS(e.target.value)} className="w-full px-2 py-1.5 text-center bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded outline-none focus:border-indigo-500 cursor-pointer">
                    <option value="">VIS</option>
                    {visOptions.map(opt => <option key={`os-vis-${opt}`} value={opt}>{opt}</option>)}
                  </select>
                </td>
              </tr>
              <tr>
                <td className="py-3 px-3 text-left font-bold text-slate-700 dark:text-slate-300">ADD (Near)</td>
                <td className="py-2 px-2">
                  <select value={addOD} onChange={(e) => setAddOD(e.target.value)} className="w-full px-2 py-1.5 text-center bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded outline-none focus:border-indigo-500 cursor-pointer">
                    <option value="">R.E. ADD</option>
                    {ADD_OPTIONS.map(opt => <option key={`od-add-${opt}`} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td className="py-2 px-2">
                  <select value={addOS} onChange={(e) => setAddOS(e.target.value)} className="w-full px-2 py-1.5 text-center bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded outline-none focus:border-indigo-500 cursor-pointer">
                    <option value="">L.E. ADD</option>
                    {ADD_OPTIONS.map(opt => <option key={`os-add-${opt}`} value={opt}>{opt}</option>)}
                  </select>
                </td>
                <td className="py-2 px-2 text-slate-400 dark:text-slate-600 select-none bg-slate-100/30 dark:bg-slate-900/10 font-bold">-</td>
                <td className="py-2 px-2 text-slate-400 dark:text-slate-600 select-none bg-slate-100/30 dark:bg-slate-900/10 font-bold">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 3: Frame, Lens & Physical parameters */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Optical Components & Customization</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            label="I.P.D. (Interpupillary Distance)"
            placeholder="e.g. 63mm"
            value={ipd}
            onChange={(e) => setIpd(e.target.value)}
          />

          <Select
            label="Shape Change Needed?"
            value={shapeChange}
            onChange={(e) => setShapeChange(e.target.value)}
            options={[
              { value: '', label: 'Select option' },
              { value: 'Yes', label: 'Yes' },
              { value: 'No', label: 'No' },
            ]}
          />

          <Select
            label="Contact Lens?"
            value={contactLens}
            onChange={(e) => setContactLens(e.target.value)}
            options={[
              { value: '', label: 'Select option' },
              { value: 'Yes', label: 'Yes' },
              { value: 'No', label: 'No' },
            ]}
          />

          <Input
            label="Pending Work Details"
            placeholder="e.g. Fitting required"
            value={pendingWork}
            onChange={(e) => setPendingWork(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">FRAME Brand & Details</label>
            <textarea
              placeholder="e.g. Ray-Ban RB5228, Matte Black, Full Rim Size 53"
              value={frame}
              onChange={(e) => setFrame(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 h-16"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">LENSES Type & Materials</label>
            <textarea
              placeholder="e.g. Crizal Prevencia Anti-Glare, Single Vision, Blue Block 1.6 Index Polycarbonate"
              value={lenses}
              onChange={(e) => setLenses(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 h-16"
            />
          </div>
        </div>
      </div>

      {/* Card 4: Financials & Balance calculation */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Financial Math</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Total Amount (AMOUNT) *"
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <Input
            label="Advance Paid (ADVANCE) *"
            type="number"
            min="0"
            value={advance}
            onChange={(e) => setAdvance(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1.5 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80 justify-center">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide">Outstanding Balance</span>
            <span className={`text-lg font-extrabold ${balance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {balance > 0 ? `₹${balance}` : 'FULLY PAID (₹0)'}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 pt-2">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Internal Order Notes</label>
          <textarea
            placeholder="Payment instructions, customer feedback or delivery notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 h-16"
          />
        </div>
      </div>

      {/* Form Action Buttons */}
      <div className="flex justify-end gap-3.5">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(isEdit ? `/dashboard/orders?id=${orderId}` : '/dashboard/orders')}
          className="cursor-pointer font-bold px-5"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={submitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 cursor-pointer flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          {isEdit ? 'Update Prescription' : 'Create & Save Order'}
        </Button>
      </div>

    </form>
  );
}
