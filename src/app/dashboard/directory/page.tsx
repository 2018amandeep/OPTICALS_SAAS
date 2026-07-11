'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Phone, Mail, Award, CheckCircle, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { validateName, validatePhone, validateEmail } from '@/lib/validation';

export default function DirectoryPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [role, setRole] = useState('Doctor');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [qualification, setQualification] = useState('');
  const [isMainDoctor, setIsMainDoctor] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      if (!res.ok) throw new Error('Failed to fetch staff directory');
      const data = await res.json();
      setStaffList(data.staff || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openAddModal = () => {
    setEditingStaff(null);
    setName('');
    setRole('Doctor');
    setPhone('');
    setEmail('');
    setQualification('');
    setIsMainDoctor(false);
    setIsActive(true);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (staff: any) => {
    setEditingStaff(staff);
    setName(staff.name || '');
    setRole(staff.role || 'Doctor');
    setPhone(staff.phone || '');
    setEmail(staff.email || '');
    setQualification(staff.qualification || '');
    setIsMainDoctor(!!staff.isMainDoctor);
    setIsActive(!!staff.isActive);
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    // Frontend Validations
    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
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

    if (email && email.trim() !== '') {
      const emailError = validateEmail(email);
      if (emailError) {
        setError(emailError);
        setSubmitting(false);
        return;
      }
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');

    const payload = {
      name,
      role,
      phone: cleanPhone,
      email,
      qualification,
      isMainDoctor: role === 'Doctor' ? isMainDoctor : false,
      isActive
    };

    try {
      const url = editingStaff ? `/api/staff/${editingStaff._id}` : '/api/staff';
      const method = editingStaff ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save directory entry');

      setSuccess(editingStaff ? 'Directory entry updated successfully!' : 'Directory entry added successfully!');
      setModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this staff member from the directory?')) return;

    try {
      const res = await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete staff member');
      fetchStaff();
    } catch (err) {
      alert('Error removing staff member');
    }
  };

  const filteredStaff = staffList.filter((item: any) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.role.toLowerCase().includes(search.toLowerCase()) ||
    (item.qualification && item.qualification.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Optometrist & Staff Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage registered doctors, optometrists, and sales executives</p>
        </div>
        <Button 
          onClick={openAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer flex items-center justify-center gap-2 font-bold shadow-md shadow-indigo-600/10"
        >
          <Plus className="w-4 h-4" />
          Add Doctor / Staff
        </Button>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-650">
          <Search className="w-4.5 h-4.5" />
        </span>
        <input
          type="text"
          placeholder="Search directory by name, role or degree..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900/60 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-semibold"
        />
      </div>

      {/* Directory Grid/Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="py-16 text-center text-slate-400 font-semibold text-sm">
            No entries found in directory. Click "Add Doctor / Staff" to add one!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-6">Name</th>
                  <th className="py-3.5 px-6">Role</th>
                  <th className="py-3.5 px-6">Qualification</th>
                  <th className="py-3.5 px-6">Contact info</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredStaff.map((person) => (
                  <tr key={person._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          person.role === 'Doctor' ? 'bg-indigo-50 dark:bg-indigo-950/45 text-indigo-650' : 'bg-emerald-50 dark:bg-emerald-950/45 text-emerald-650'
                        }`}>
                          {person.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {person.name}
                            {person.isMainDoctor && (
                              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 px-1.5 py-0.5 rounded">
                                Default Doctor
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        person.role === 'Doctor' ? 'bg-indigo-500/10 text-indigo-600' : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        {person.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-400">
                      {person.qualification ? (
                        <span className="flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-slate-400" />
                          {person.qualification}
                        </span>
                      ) : '--'}
                    </td>
                    <td className="py-4 px-6 text-slate-650 dark:text-slate-400">
                      <div className="flex flex-col gap-0.5">
                        {person.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {person.phone}
                          </span>
                        )}
                        {person.email && (
                          <span className="flex items-center gap-1 text-[10px] text-slate-450">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {person.email}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        person.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-400'
                      }`}>
                        {person.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="inline-flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 !p-0 flex items-center justify-center cursor-pointer"
                          onClick={() => openEditModal(person)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 w-8 !p-0 flex items-center justify-center cursor-pointer border-red-205 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => handleDelete(person._id)}
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

      {/* Directory Entry Add/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl animate-scale-up">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-base">{editingStaff ? 'Edit Staff Member' : 'Register Doctor / Staff'}</h3>
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
                  label="Name *"
                  placeholder="e.g. Dr. Anjali Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <Select
                  label="Role *"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  options={[
                    { value: 'Doctor', label: 'Optometrist / Doctor' },
                    { value: 'Staff', label: 'Support / Sales Staff' }
                  ]}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone / Mobile"
                  placeholder="e.g. 9811075234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  maxLength={10}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="doctor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {role === 'Doctor' && (
                <div className="space-y-4">
                  <Input
                    label="Qualification / Degree"
                    placeholder="e.g. B.Optom, Ophthalmologist"
                    value={qualification}
                    onChange={(e) => setQualification(e.target.value)}
                  />
                  
                  <div className="flex items-center gap-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 p-3.5 rounded-xl">
                    <input
                      type="checkbox"
                      id="mainDoctorCheck"
                      checked={isMainDoctor}
                      onChange={(e) => setIsMainDoctor(e.target.checked)}
                      className="h-4.5 w-4.5 accent-indigo-650 cursor-pointer rounded"
                    />
                    <label htmlFor="mainDoctorCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">
                      Set as Default Doctor (Prefilled Optometrist)
                    </label>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/80 p-3.5 rounded-xl">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4.5 w-4.5 accent-indigo-650 cursor-pointer rounded"
                />
                <label htmlFor="isActiveCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer">
                  Active Directory Member
                </label>
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
                  className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer font-bold px-4"
                >
                  Save Entry
                </Button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
