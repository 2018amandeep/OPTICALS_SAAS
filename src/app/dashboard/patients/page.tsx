'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Plus, User, Phone, MapPin, Eye, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { validateName, validatePhone, validateEmail } from '@/lib/validation';

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState('');
  
  // Form fields for new patient
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');
  const [code, setCode] = useState('');
  const [notes, setNotes] = useState('');
  const [editingPatient, setEditingPatient] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingPatient(null);
    setName('');
    setPhone('');
    setEmail('');
    setAge('');
    setGender('');
    setAddress('');
    setCode('');
    setNotes('');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (patient: any) => {
    setEditingPatient(patient);
    setName(patient.name || '');
    setPhone(patient.phone || '');
    setEmail(patient.email || '');
    setAge(patient.age ? String(patient.age) : '');
    setGender(patient.gender || '');
    setAddress(patient.address || '');
    setCode(patient.code || '');
    setNotes(patient.notes || '');
    setError('');
    setModalOpen(true);
  };

  const fetchPatients = async (query = '') => {
    try {
      const res = await fetch(`/api/patients?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Failed to fetch patients');
      const data = await res.json();
      setPatients(data.patients);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchPatients(search);
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const nameError = validateName(name);
    if (nameError) {
      setError(`Patient ${nameError}`);
      setSubmitting(false);
      return;
    }

    const phoneError = validatePhone(phone);
    if (phoneError) {
      setError(phoneError);
      setSubmitting(false);
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      setSubmitting(false);
      return;
    }

    if (age && (parseInt(age) < 0 || parseInt(age) > 200)) {
      setError('Age must be between 0 and 200');
      setSubmitting(false);
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    try {
      const url = editingPatient ? `/api/patients/${editingPatient._id}` : '/api/patients';
      const method = editingPatient ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone: cleanPhone, email, age, gender, address, code, notes }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${editingPatient ? 'update' : 'register'} patient`);
      }

      // Reset form
      setName('');
      setPhone('');
      setEmail('');
      setAge('');
      setGender('');
      setAddress('');
      setCode('');
      setNotes('');
      setEditingPatient(null);
      setModalOpen(false);
      fetchPatients(search);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this patient? This will also delete all their orders!')) return;
    
    try {
      const res = await fetch(`/api/patients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete patient');
      fetchPatients(search);
    } catch (err) {
      alert('Error deleting patient');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patients Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage patient demographics and ocular histories</p>
        </div>
        <Button 
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer flex items-center justify-center gap-2 font-bold shadow-md shadow-indigo-600/10"
        >
          <Plus className="w-4 h-4" />
          Register Patient
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-600">
          <Search className="w-4.5 h-4.5" />
        </span>
        <input
          type="text"
          placeholder="Search patients by name, phone or code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900/60 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Patients Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : patients.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-medium text-sm">
            No patients registered yet. Click "Register Patient" to add one!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Code</th>
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Contact info</th>
                  <th className="py-3.5 px-6">Age / Gender</th>
                  <th className="py-3.5 px-6">Address</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {patients.map((patient) => (
                  <tr key={patient._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-6 text-indigo-500 dark:text-indigo-400 font-bold">
                      {patient.code || '--'}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-xs">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{patient.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {patient.phone}
                        </span>
                        {patient.email && <span className="text-[10px] text-slate-400">{patient.email}</span>}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                      {patient.age ? `${patient.age} yrs` : '--'} / {patient.gender || '--'}
                    </td>
                    <td className="py-4 px-6 text-slate-500 truncate max-w-[160px]">
                      {patient.address ? (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                          {patient.address}
                        </span>
                      ) : '--'}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex gap-2">
                        <Link href={`/dashboard/patients/${patient._id}`}>
                          <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold cursor-pointer">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            History
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 !p-0 flex items-center justify-center cursor-pointer text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                          onClick={() => openEditModal(patient)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 !p-0 flex items-center justify-center cursor-pointer border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => handleDelete(patient._id)}
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

      {/* Register Patient Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-base">{editingPatient ? 'Edit Patient Details' : 'Register New Patient'}</h3>
              </div>
              <button 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                onClick={() => setModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Patient Code (Optional)"
                  placeholder="Auto-generated if left blank"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <Input
                  label="Full Name *"
                  placeholder="e.g. Rajesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone / Mobile *"
                  placeholder="e.g. 9811075234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  maxLength={10}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="rajesh@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Age"
                  type="number"
                  placeholder="e.g. 42"
                  value={age}
                  min={0}
                  max={200}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 200)) {
                      setAge(val);
                    }
                  }}
                />
                <Select
                  label="Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  options={[
                    { value: '', label: 'Select Gender' },
                    { value: 'Male', label: 'Male' },
                    { value: 'Female', label: 'Female' },
                    { value: 'Other', label: 'Other' },
                  ]}
                />
              </div>

              <Input
                label="Home Address"
                placeholder="e.g. 1655, Rani Bagh, Delhi-110034"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Medical / Optic Notes</label>
                <textarea
                  placeholder="History of diabetes, glaucoma, or specific lens preferences..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 h-20"
                />
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-white dark:bg-slate-900">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  isLoading={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                >
                  Register Patient
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
