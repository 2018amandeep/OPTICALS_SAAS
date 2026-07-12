'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageCircle, Send, CheckCircle2, AlertCircle, X, ShieldAlert,
  Users, CheckSquare, Square, RefreshCw, Smartphone, LogOut, Check
} from 'lucide-react';
import Button from '@/components/ui/Button';

export default function BroadcastPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('Hello {name}, greetings from {shopName}! We have exciting new offers on premium frames and blue-cut lenses. Visit us today to upgrade your vision!');
  const [appendStopText, setAppendStopText] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [shopName, setShopName] = useState('Our Shop');

  // WhatsApp Web Service States
  const [serviceStatus, setServiceStatus] = useState('DISCONNECTED'); // INITIALIZING, QR_READY, CONNECTED, DISCONNECTED
  const [qrCodeImage, setQrCodeImage] = useState('');
  const [campaign, setCampaign] = useState<any>({
    active: false,
    total: 0,
    sent: 0,
    successCount: 0,
    failedCount: 0,
    failures: []
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch initial patient list and shop profile name
  useEffect(() => {
    async function initData() {
      try {
        const patientsRes = await fetch('/api/patients');
        if (patientsRes.ok) {
          const patientsData = await patientsRes.json();
          const list = patientsData.patients || [];
          setPatients(list);
          setSelectedIds(list.map((p: any) => p._id));
        }

        const shopRes = await fetch('/api/auth/me');
        if (shopRes.ok) {
          const shopData = await shopRes.json();
          if (shopData.shop?.name) {
            setShopName(shopData.shop.name);
          }
        }
      } catch (err) {
        console.error('Error fetching broadcast data:', err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  // Poll WhatsApp service status
  useEffect(() => {
    async function checkStatus() {
      try {
        const statusRes = await fetch('/api/whatsapp/status');
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setServiceStatus(statusData.status);
          setQrCodeImage(statusData.qrImage || '');
          if (statusData.campaign) {
            setCampaign(statusData.campaign);
          }
        } else {
          setServiceStatus('DISCONNECTED');
        }
      } catch (err) {
        setServiceStatus('DISCONNECTED');
      }
    }

    checkStatus(); // check immediately
    const interval = setInterval(checkStatus, 3000); // check status every 3 seconds
    return () => clearInterval(interval);
  }, []);

  // WhatsApp Message Logs State
  const [activeTab, setActiveTab] = useState<'campaign' | 'logs'>('campaign');
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsSearch, setLogsSearch] = useState('');
  const [logsType, setLogsType] = useState('');
  const [logsStatus, setLogsStatus] = useState('');

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const q = new URLSearchParams();
      if (logsSearch) q.set('search', logsSearch);
      if (logsType) q.set('type', logsType);
      if (logsStatus) q.set('status', logsStatus);

      const res = await fetch(`/api/whatsapp/logs?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch whatsapp logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab, logsType, logsStatus]);

  useEffect(() => {
    if (activeTab !== 'logs') return;
    const timer = setTimeout(() => {
      fetchLogs();
    }, 450);
    return () => clearTimeout(timer);
  }, [logsSearch]);

  const handleSelectToggle = (id: string) => {
    if (campaign.active) return; // Prevent selection changes during campaign
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (campaign.active) return;
    if (selectedIds.length === patients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(patients.map((p) => p._id));
    }
  };

  const getPersonalizedMessage = (patientName: string) => {
    let finalMessage = messageText
      .replace(/{name}/g, patientName)
      .replace(/{shopName}/g, shopName);
    
    if (appendStopText) {
      finalMessage += '\n\nReply STOP to unsubscribe.';
    }
    return finalMessage;
  };

  const selectedPatients = patients.filter((p) => selectedIds.includes(p._id));

  // Trigger Broadcast Campaign on Express Service
  const startBroadcast = async () => {
    setError('');
    setSuccess('');
    setSubmitting(true);

    if (selectedPatients.length === 0) {
      setError('Please select at least one recipient.');
      setSubmitting(false);
      return;
    }

    if (!messageText.trim()) {
      setError('Message content cannot be blank.');
      setSubmitting(false);
      return;
    }

    const payload = {
      recipients: selectedPatients.map((p) => ({
        name: p.name,
        phone: p.phone,
        shopName: shopName
      })),
      message: messageText + (appendStopText ? '\n\nReply STOP to unsubscribe.' : '')
    };

    try {
      const res = await fetch('/api/whatsapp/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start campaign');

      setSuccess('Broadcast campaign successfully launched in background!');
    } catch (err: any) {
      setError(err.message || 'Could not communicate with WhatsApp helper service.');
    } finally {
      setSubmitting(false);
    }
  };

  // Disconnect session
  const logoutService = async () => {
    if (!confirm('Are you sure you want to disconnect WhatsApp and log out?')) return;
    try {
      await fetch('/api/whatsapp/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Cancel campaign
  const cancelCampaign = async () => {
    try {
      await fetch('/api/whatsapp/cancel', { method: 'POST' });
    } catch (err) {
      console.error('Cancellation failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">WhatsApp Campaign Center</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Secure, background broadcasting to patient contacts with delivery logs and anti-ban safeguards.
          </p>
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('campaign')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'campaign'
              ? 'border-indigo-600 text-indigo-650 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          📢 Broadcast Campaign
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'logs'
              ? 'border-indigo-600 text-indigo-650 dark:text-indigo-400 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
          }`}
        >
          📜 Sent Message Logs
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Main Grid View */}
      {activeTab === 'campaign' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns: WhatsApp Web Scanner & Message Composer */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: WhatsApp Client Authentication Status */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-500 font-bold">
                <Smartphone className="w-5 h-5" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-550 dark:text-slate-400">
                  WhatsApp Device Connection
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                serviceStatus === 'CONNECTED' 
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : serviceStatus === 'QR_READY'
                  ? 'bg-amber-500/10 text-amber-600'
                  : 'bg-slate-500/10 text-slate-500 animate-pulse'
              }`}>
                {serviceStatus === 'CONNECTED' ? 'Ready & Connected' : serviceStatus === 'QR_READY' ? 'Scan Code Required' : 'Starting Client...'}
              </span>
            </div>

            {/* If Client is starting */}
            {serviceStatus === 'INITIALIZING' && (
              <div className="py-8 text-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm font-bold text-slate-500">Launching headless WhatsApp client...</p>
              </div>
            )}

            {/* If Client needs QR Code Scan */}
            {serviceStatus === 'QR_READY' && qrCodeImage && (
              <div className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-800/80">
                <div className="bg-white p-3 rounded-lg border shadow-sm">
                  <img src={qrCodeImage} alt="WhatsApp Web QR Code" className="w-44 h-44" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Scan this QR Code</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                    1. Open WhatsApp on your phone.<br />
                    2. Tap <strong>Menu</strong> or <strong>Settings</strong> and select <strong>Linked Devices</strong>.<br />
                    3. Tap on <strong>Link a Device</strong> and point your camera at this QR code.<br />
                    Once authenticated, your session will save automatically.
                  </p>
                </div>
              </div>
            )}

            {/* If Client is connected */}
            {serviceStatus === 'CONNECTED' && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center font-bold text-sm">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">WhatsApp Web Authenticated</h4>
                    <p className="text-xs text-slate-400 font-semibold">Ready to dispatch background broadcast campaigns.</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={logoutService}
                  className="cursor-pointer font-bold border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs py-1.5 px-3 flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </Button>
              </div>
            )}

            {/* If Client is offline / background helper not running */}
            {serviceStatus === 'DISCONNECTED' && (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-450 leading-relaxed font-bold space-y-1">
                <p>⚠️ Background WhatsApp Service is offline / not running.</p>
                <p className="text-slate-400 font-medium">To run the background helper service, make sure to execute the command <code className="bg-slate-100 dark:bg-slate-900 px-1 py-0.5 rounded font-mono text-[10px]">node whatsapp-service.js</code> or check your npm process launcher.</p>
              </div>
            )}
          </div>

          {/* Card 2: Broadcast Composer (only operational when connected) */}
          <div className={`p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 ${
            serviceStatus !== 'CONNECTED' ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <div className="flex items-center gap-2 text-indigo-500 font-bold">
              <MessageCircle className="w-5 h-5" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-550 dark:text-slate-400">
                Compose Broadcast Campaign
              </h3>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-650 dark:text-slate-450 uppercase block">
                Message Template *
              </label>
              <textarea
                className="w-full h-32 px-4 py-3 border border-slate-200 dark:border-slate-850 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-slate-100 focus:border-indigo-500 outline-none resize-none font-medium leading-relaxed"
                value={messageText}
                onChange={(e) => {
                  setMessageText(e.target.value);
                  setError('');
                }}
                disabled={campaign.active}
                placeholder="Type your broadcast message..."
              />
            </div>

            {/* Anti-Ban Stop / Opt-out Safeguard Option */}
            <div className="flex items-center gap-2.5 p-3 bg-indigo-50/30 dark:bg-indigo-950/15 border border-indigo-100 dark:border-indigo-900/30 rounded-xl">
              <input
                type="checkbox"
                id="optOutCheck"
                checked={appendStopText}
                onChange={(e) => setAppendStopText(e.target.checked)}
                disabled={campaign.active}
                className="h-4.5 w-4.5 accent-indigo-650 cursor-pointer rounded"
              />
              <label htmlFor="optOutCheck" className="text-xs font-bold text-slate-705 dark:text-slate-350 cursor-pointer">
                Append unsubscription footer <span className="text-[10px] text-slate-400">("Reply STOP to unsubscribe")</span>
              </label>
            </div>

            {/* Preview Section */}
            {patients.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <label className="text-xs font-bold text-slate-450 uppercase block">
                  Message Preview (for {patients[0].name})
                </label>
                <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-150 dark:border-emerald-900/30 text-xs text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-wrap font-semibold">
                  {getPersonalizedMessage(patients[0].name)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Execution Controls & Target Selection */}
        <div className="space-y-6">
          
          {/* Card 3: Execution Campaign Panel */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-indigo-500 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Send className="w-5 h-5" />
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Campaign Progress
              </h3>
            </div>

            {selectedIds.length === 0 ? (
              <div className="text-center py-6 text-slate-400 font-bold text-xs">
                Select target patients below to begin broadcast.
              </div>
            ) : serviceStatus !== 'CONNECTED' ? (
              <div className="text-center py-6 text-slate-400 font-bold text-xs">
                Scan QR code first to activate campaign controls.
              </div>
            ) : (
              <div className="space-y-5">
                {/* Progress bar */}
                <div className="space-y-2.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-400 uppercase">Status</span>
                    <span className="text-slate-800 dark:text-slate-200">
                      {campaign.sent} / {campaign.total || selectedPatients.length} Sent
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-600 to-blue-500 transition-all duration-300"
                      style={{
                        width: `${((campaign.sent || 0) / (campaign.total || selectedPatients.length)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Counters grid */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-0.5">Successes</p>
                    <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{campaign.successCount || 0}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-500 font-bold mb-0.5">Failures</p>
                    <p className="text-lg font-extrabold text-red-650 dark:text-red-500">{campaign.failedCount || 0}</p>
                  </div>
                </div>

                {/* Start Campaign / Cancel Action */}
                {!campaign.active && campaign.sent === 0 ? (
                  <Button
                    onClick={startBroadcast}
                    isLoading={submitting}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer text-xs flex items-center justify-center gap-1.5 py-3 shadow-md shadow-indigo-600/10"
                  >
                    <Send className="w-4 h-4" />
                    Launch WhatsApp Campaign
                  </Button>
                ) : campaign.active ? (
                  <div className="space-y-3">
                    <div className="py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 animate-pulse bg-slate-50 dark:bg-slate-950/20 rounded-xl">
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-indigo-600"></div>
                      <span>{campaign.statusText || 'Sending message queue in background...'}</span>
                    </div>
                    <Button
                      variant="outline"
                      onClick={cancelCampaign}
                      className="w-full border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 font-bold cursor-pointer text-xs py-2.5"
                    >
                      Cancel Campaign
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-2 animate-pulse">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold">Campaign Finished!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Card 4: Recipient list directory */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-indigo-500 font-bold">
                <Users className="w-5 h-5" />
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Broadcast Targets ({selectedIds.length})
                </h3>
              </div>
              <button
                onClick={handleSelectAll}
                disabled={campaign.active}
                className="text-xs font-bold text-indigo-500 dark:text-indigo-400 hover:underline cursor-pointer disabled:opacity-50"
              >
                {selectedIds.length === patients.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {patients.map((patient) => {
                const isChecked = selectedIds.includes(patient._id);
                return (
                  <div
                    key={patient._id}
                    onClick={() => handleSelectToggle(patient._id)}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      campaign.active ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
                    } ${
                      isChecked
                        ? 'border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/25'
                        : 'border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{patient.name}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{patient.phone}</p>
                    </div>
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-indigo-650 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
      )}

      {activeTab === 'logs' && (
        <div className="space-y-6 animate-scale-up">
          {/* Filters Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400">Search & Filter Logs</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search input */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Recipient Name / Phone / Message</label>
                <input
                  type="text"
                  value={logsSearch}
                  onChange={(e) => setLogsSearch(e.target.value)}
                  placeholder="Type name, number, content..."
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-850 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-slate-100 focus:border-indigo-550 outline-none font-medium"
                />
              </div>

              {/* Message Type filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Message Category</label>
                <select
                  value={logsType}
                  onChange={(e) => setLogsType(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-850 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-slate-100 focus:border-indigo-550 outline-none font-medium"
                >
                  <option value="">All Categories</option>
                  <option value="broadcast">Broadcasts</option>
                  <option value="order_msg">Order Confirmed</option>
                  <option value="ready_msg">Ready Reminders</option>
                  <option value="balance_msg">Balance Reminders</option>
                  <option value="single_msg">Single Message</option>
                </select>
              </div>

              {/* Status filter */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-450 uppercase">Delivery Status</label>
                <select
                  value={logsStatus}
                  onChange={(e) => setLogsStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-slate-850 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-950/20 text-slate-900 dark:text-slate-100 focus:border-indigo-550 outline-none font-medium"
                >
                  <option value="">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Logs Table Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-800 pb-4 mb-4">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-550 dark:text-slate-400">WhatsApp Delivery History</h3>
              <button 
                onClick={fetchLogs} 
                disabled={logsLoading}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${logsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {logsLoading && logs.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-650 mx-auto"></div>
                <p className="text-xs text-slate-400 font-bold">Querying message history logs...</p>
              </div>
            ) : logs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-bold text-xs">
                No matching WhatsApp logs found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="pb-3">Timestamp</th>
                      <th className="pb-3">Recipient</th>
                      <th className="pb-3">Phone</th>
                      <th className="pb-3">Category</th>
                      <th className="pb-3">Message</th>
                      <th className="pb-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id} className="border-b border-slate-50 dark:border-slate-800/40 hover:bg-slate-50/50 dark:hover:bg-slate-950/10">
                        <td className="py-3 text-slate-400 font-semibold whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 font-bold text-slate-750 dark:text-slate-300">
                          {log.recipientName || 'Customer'}
                        </td>
                        <td className="py-3 font-mono font-bold text-slate-500 dark:text-slate-400">
                          {log.phone}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                            log.type === 'broadcast' 
                              ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400'
                              : log.type === 'order_msg'
                              ? 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
                              : log.type === 'ready_msg'
                              ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                              : log.type === 'balance_msg'
                              ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {log.type === 'broadcast' ? 'Broadcast' : log.type === 'order_msg' ? 'Ordered' : log.type === 'ready_msg' ? 'Ready' : log.type === 'balance_msg' ? 'Balance' : 'Single'}
                          </span>
                        </td>
                        <td className="py-3 max-w-[280px] truncate font-medium text-slate-750 dark:text-slate-300" title={log.message}>
                          {log.message}
                        </td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            log.status === 'success'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
