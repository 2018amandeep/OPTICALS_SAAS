'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { validateName, validatePhone } from '@/lib/validation';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Settings State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [taxRate, setTaxRate] = useState('0');
  
  // Doctor & Staff Management
  const [mainDoctor, setMainDoctor] = useState('Dr. Malhotra');
  const [doctors, setDoctors] = useState<string[]>([]);
  const [staff, setStaff] = useState<string[]>([]);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  
  // WhatsApp Templates
  const [whatsappTemplateOrder, setWhatsappTemplateOrder] = useState('');
  const [whatsappTemplateReady, setWhatsappTemplateReady] = useState('');
  const [whatsappTemplateBalance, setWhatsappTemplateBalance] = useState('');

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();
      const shop = data.shop;

      setName(shop.name || '');
      setPhone(shop.phone || '');
      setAddress(shop.address || '');
      setCurrency(shop.currency || 'INR');
      setTaxRate(String(shop.taxRate || 0));
      
      setWhatsappTemplateOrder(shop.whatsappTemplateOrder || '');
      setWhatsappTemplateReady(shop.whatsappTemplateReady || '');
      setWhatsappTemplateBalance(shop.whatsappTemplateBalance || '');

      setMainDoctor(shop.mainDoctor || 'Dr. Malhotra');
      setDoctors(shop.doctors || []);
      setStaff(shop.staff || []);
    } catch (err: any) {
      setError(err.message || 'Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    const nameError = validateName(name);
    if (nameError) {
      setError(`Shop ${nameError}`);
      setSubmitting(false);
      return;
    }

    if (phone && phone.trim() !== '') {
      const phoneError = validatePhone(phone);
      if (phoneError) {
        setError(phoneError);
        setSubmitting(false);
        return;
      }
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const payload = {
      name,
      phone: cleanPhone,
      address,
      currency,
      taxRate: parseFloat(taxRate) || 0,
      whatsappTemplateOrder,
      whatsappTemplateReady,
      whatsappTemplateBalance,
      mainDoctor,
      doctors,
      staff
    };

    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setSuccess('Settings updated successfully!');
      // Scroll to top to see success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
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
      


      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {/* Card 1: General Business Configuration */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-indigo-500">
          <Settings className="w-5 h-5" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Shop Profile & Settings</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Shop Name *"
            placeholder="e.g. Malhotra Opticals"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
           <Input
            label="Contact Mobile / Phone"
            placeholder="e.g. 9811075234"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
            maxLength={10}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Currency Symbol"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            options={[
              { value: 'INR', label: 'INR (₹)' },
              { value: 'USD', label: 'USD ($)' },
              { value: 'EUR', label: 'EUR (€)' },
            ]}
          />
          <Input
            label="Tax Rate (%)"
            type="number"
            min="0"
            max="100"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
          />
        </div>

        <Input
          label="Shop Address"
          placeholder="e.g. 1655, Rani Bagh, Delhi-110034"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      {/* Card 1.5: Doctor and Staff Management */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex items-center gap-2 text-indigo-500 border-b border-slate-100 dark:border-slate-800 pb-3">
          <span className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500">🧑‍⚕️</span>
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Optometrist & Staff Directory</h3>
        </div>

        {/* 1. Main Doctor */}
        <div className="max-w-md space-y-1.5">
          <Input
            label="Main / Owner Doctor *"
            placeholder="e.g. Dr. Malhotra"
            value={mainDoctor}
            onChange={(e) => setMainDoctor(e.target.value)}
            required
          />
          <p className="text-[10px] text-slate-400">This doctor's name will automatically prefill as the default Optometrist on new orders.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* 2. Additional Doctors */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide block">
              Additional Optometrists / Doctors
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Dr. Anjali Sharma"
                value={newDoctorName}
                onChange={(e) => setNewDoctorName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
              />
              <Button
                type="button"
                onClick={() => {
                  if (newDoctorName.trim()) {
                    setDoctors([...doctors, newDoctorName.trim()]);
                    setNewDoctorName('');
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer px-4 font-bold text-xs"
              >
                Add
              </Button>
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {doctors.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold py-2">No additional doctors added.</p>
              ) : (
                doctors.map((docName, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-700 dark:text-slate-350">{docName}</span>
                    <button
                      type="button"
                      onClick={() => setDoctors(doctors.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700 cursor-pointer font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. Staff Members */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide block">
              Support Staff / Sales Executives
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Ramesh Kumar"
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-lg text-sm bg-slate-50/50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 font-medium"
              />
              <Button
                type="button"
                onClick={() => {
                  if (newStaffName.trim()) {
                    setStaff([...staff, newStaffName.trim()]);
                    setNewStaffName('');
                  }
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer px-4 font-bold text-xs"
              >
                Add
              </Button>
            </div>

            <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
              {staff.length === 0 ? (
                <p className="text-xs text-slate-400 font-semibold py-2">No staff members added.</p>
              ) : (
                staff.map((staffName, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs font-bold bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span className="text-slate-700 dark:text-slate-350">{staffName}</span>
                    <button
                      type="button"
                      onClick={() => setStaff(staff.filter((_, i) => i !== idx))}
                      className="text-red-500 hover:text-red-700 cursor-pointer font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card 2: WhatsApp Templates customization */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-2 text-emerald-500">
          <MessageSquare className="w-5 h-5" />
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">WhatsApp Notification Templates</h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
          <strong>Variable Legend:</strong> Use the following tokens in your templates to dynamically merge order data:
          <span className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[10px] font-mono">
            <span className="bg-white dark:bg-slate-900 border px-2 py-1 rounded text-center text-indigo-500">{`{patientName}`}</span>
            <span className="bg-white dark:bg-slate-900 border px-2 py-1 rounded text-center text-indigo-500">{`{orderNumber}`}</span>
            <span className="bg-white dark:bg-slate-900 border px-2 py-1 rounded text-center text-indigo-500">{`{totalAmount}`}</span>
            <span className="bg-white dark:bg-slate-900 border px-2 py-1 rounded text-center text-indigo-500">{`{advanceAmount}`}</span>
            <span className="bg-white dark:bg-slate-900 border px-2 py-1 rounded text-center text-indigo-500">{`{balanceAmount}`}</span>
            <span className="bg-white dark:bg-slate-900 border px-2 py-1 rounded text-center text-indigo-500">{`{deliveryDate}`}</span>
            <span className="bg-white dark:bg-slate-900 border px-2 py-1 rounded text-center text-indigo-500">{`{shopName}`}</span>
            <span className="bg-white dark:bg-slate-900 border px-2 py-1 rounded text-center text-indigo-500">{`{receiptUrl}`}</span>
          </span>
        </p>

        <div className="space-y-4 font-semibold text-xs">
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Order Created Message Template</label>
            <textarea
              value={whatsappTemplateOrder}
              onChange={(e) => setWhatsappTemplateOrder(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 h-20 font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Glasses / Lenses Ready Message Template</label>
            <textarea
              value={whatsappTemplateReady}
              onChange={(e) => setWhatsappTemplateReady(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 h-20 font-medium"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Pending Balance Reminder Template</label>
            <textarea
              value={whatsappTemplateBalance}
              onChange={(e) => setWhatsappTemplateBalance(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 h-20 font-medium"
            />
          </div>

        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold flex items-center gap-2 animate-fade-in">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Save Settings Action Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          isLoading={submitting}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 cursor-pointer flex items-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          Save Configurations
        </Button>
      </div>

    </form>
  );
}
