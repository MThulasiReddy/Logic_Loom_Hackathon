import React, { useState, useEffect } from 'react';
import {
  SendHorizontal,
  Wallet,
  ShieldCheck,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sparkles,
  KeyRound,
  X,
  User,
  ChevronDown,
  Globe,
  Smartphone,
  MapPin,
  Building2,
  CreditCard,
  Wifi,
  ShieldAlert,
  Info
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatIST, formatISTShort } from '../utils/date';

const VPN_TEST_PRESETS = [
  { id: 'auto', label: '🌐 Live Connection (Auto-Detect / My Active VPN)', ip: null, country: null, code: null, city: null },
  { id: 'us_vpn', label: '🇺🇸 US VPN (New York — Geofence Alert)', ip: '198.51.100.24', country: 'United States', code: 'US', city: 'New York' },
  { id: 'uk_vpn', label: '🇬🇧 UK VPN (London — Cross-Border)', ip: '185.86.151.11', country: 'United Kingdom', code: 'GB', city: 'London' },
  { id: 'sg_vpn', label: '🇸🇬 Singapore VPN (Foreign Gateway)', ip: '103.253.25.88', country: 'Singapore', code: 'SG', city: 'Singapore' },
  { id: 'in_domestic', label: '🇮🇳 Domestic India (Mumbai — Normal Route)', ip: '49.36.128.5', country: 'India', code: 'IN', city: 'Mumbai' },
];

const UserPaymentPage = () => {
  const { user, updateBalance } = useAuth();
  const [recipients, setRecipients] = useState([]);
  const [loadingRecipients, setLoadingRecipients] = useState(true);

  // Live Location & VPN State
  const [vpnMode, setVpnMode] = useState('auto');
  const [liveLocation, setLiveLocation] = useState({
    ip: '127.0.0.1',
    country: 'India',
    countryCode: 'IN',
    city: 'Mumbai',
    isLiveDetected: false
  });
  const [customIp, setCustomIp] = useState('');
  const [customCountry, setCustomCountry] = useState('United States');

  const [formData, setFormData] = useState({
    receiver_upi_id: '',
    amount_inr: 1000,
    transaction_type: 'P2P',
    merchant_category: 'Other',
    sender_bank: user?.bank_name || 'State Bank of India',
    receiver_bank: 'HDFC Bank',
    sender_state: user?.state || 'Maharashtra',
    sender_age_group: user?.age_group || '26-35',
    receiver_age_group: '26-35',
    device_type: 'Android',
    network_type: '4G',
  });

  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);
  const [error, setError] = useState('');

  // OTP modal state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpTxRef, setOtpTxRef] = useState('');
  const [demoOtpHint, setDemoOtpHint] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // User payment history
  const [myHistory, setMyHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Attempt to auto-detect client's public IP from browser (detects if user enabled a real VPN)
  const detectLiveIp = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data && data.ip) {
          setLiveLocation({
            ip: data.ip,
            country: data.country_name || 'India',
            countryCode: data.country_code || 'IN',
            city: data.city || 'Domestic',
            isLiveDetected: true
          });
          return;
        }
      }
    } catch (e) {
      // fallback
    }

    try {
      const res2 = await fetch('https://api.ipify.org?format=json');
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2 && data2.ip) {
          setLiveLocation(prev => ({
            ...prev,
            ip: data2.ip,
            isLiveDetected: true
          }));
        }
      }
    } catch (e2) {}
  };

  useEffect(() => {
    detectLiveIp();
  }, []);

  // Update sender info if user profile updates
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        sender_bank: user.bank_name || prev.sender_bank,
        sender_state: user.state || prev.sender_state,
        sender_age_group: user.age_group || prev.sender_age_group,
      }));
    }
  }, [user]);

  const fetchRecipients = async () => {
    try {
      setLoadingRecipients(true);
      const res = await apiClient.get('/api/payments/recipients');
      setRecipients(res.data || []);
      if (res.data && res.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          receiver_upi_id: res.data[0].upi_id,
          receiver_bank: res.data[0].bank_name || 'HDFC Bank',
          receiver_age_group: res.data[0].age_group || '26-35',
        }));
      }
    } catch (e) {
      console.error('Failed to load recipients', e);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const res = await apiClient.get('/api/payments/my-transactions');
      setMyHistory(res.data.transactions || []);
      if (res.data.wallet_balance !== undefined) {
        updateBalance(res.data.wallet_balance);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchRecipients();
    fetchHistory();
  }, []);

  const selectedRecipient = recipients.find(r => r.upi_id === formData.receiver_upi_id);

  // Determine active effective IP and Country based on VPN selector
  const getEffectiveConnection = () => {
    if (vpnMode === 'auto') {
      return {
        ip: liveLocation.ip,
        country: liveLocation.country,
        countryCode: liveLocation.countryCode,
        city: liveLocation.city,
        modeLabel: liveLocation.isLiveDetected ? 'Live Detected Network / Active VPN' : 'Local Sandbox Gateway',
        isSimulated: false
      };
    }
    const preset = VPN_TEST_PRESETS.find(p => p.id === vpnMode);
    if (preset) {
      return {
        ip: preset.ip,
        country: preset.country,
        countryCode: preset.code,
        city: preset.city,
        modeLabel: preset.label,
        isSimulated: true
      };
    }
    if (vpnMode === 'custom') {
      return {
        ip: customIp || '198.51.100.99',
        country: customCountry || 'United States',
        countryCode: 'XX',
        city: 'Custom Exit Node',
        modeLabel: 'Custom VPN Simulation',
        isSimulated: true
      };
    }
    return {
      ip: liveLocation.ip,
      country: liveLocation.country,
      countryCode: liveLocation.countryCode,
      city: liveLocation.city,
      modeLabel: 'Standard Domestic',
      isSimulated: false
    };
  };

  const activeConnection = getEffectiveConnection();
  const registeredCountry = user?.country || 'India';
  const isCrossBorderAlert = (
    activeConnection.country &&
    registeredCountry &&
    activeConnection.country.toLowerCase() !== registeredCountry.toLowerCase() &&
    !(activeConnection.country.toLowerCase() === 'india' && registeredCountry.toLowerCase() === 'in')
  );

  const handlePay = async (e) => {
    e.preventDefault();
    if (!formData.receiver_upi_id) {
      setError('Please select a recipient.');
      return;
    }
    setLoading(true);
    setError('');
    setPaymentResult(null);

    const payPayload = {
      ...formData,
      client_ip: activeConnection.ip,
      client_country: activeConnection.country,
      client_country_code: activeConnection.countryCode,
      client_city: activeConnection.city,
      sender_country: registeredCountry,
      sender_bank: formData.sender_bank || user?.bank_name || 'State Bank of India',
      sender_state: formData.sender_state || user?.state || 'Maharashtra',
      sender_age_group: user?.age_group || '26-35',
      receiver_bank: selectedRecipient?.bank_name || formData.receiver_bank || 'HDFC Bank',
      receiver_age_group: selectedRecipient?.age_group || formData.receiver_age_group || '26-35',
    };

    try {
      const res = await apiClient.post('/api/payments/pay', payPayload);
      setPaymentResult(res.data);
      if (res.data.updated_wallet_balance !== undefined) {
        updateBalance(res.data.updated_wallet_balance);
      }

      if (res.data.status === 'PENDING_OTP') {
        setOtpTxRef(res.data.transaction_reference);
        setDemoOtpHint(res.data.demo_otp || '749281');
        setShowOtpModal(true);
      }

      fetchHistory();
    } catch (err) {
      setError(err.response?.data?.detail || 'Payment authorization failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError('');

    try {
      const res = await apiClient.post('/api/payments/verify-otp', {
        transaction_reference: otpTxRef,
        otp: otpValue
      });
      setShowOtpModal(false);
      setOtpValue('');
      if (res.data.updated_wallet_balance !== undefined) {
        updateBalance(res.data.updated_wallet_balance);
      }
      setPaymentResult({
        ...paymentResult,
        status: 'APPROVED',
        success: true,
        message: 'Step-Up OTP Verified! Payment has been safely released and credited to recipient.'
      });
      fetchHistory();
    } catch (err) {
      setOtpError(err.response?.data?.detail || 'OTP verification failed.');
    } finally {
      setOtpLoading(false);
    }
  };

  const quickAmounts = [
    { label: '₹500', amount: 500, category: 'Grocery', type: 'P2M', desc: 'Standard Low Risk' },
    { label: '₹2,500', amount: 2500, category: 'Shopping', type: 'P2M', desc: 'Typical Retail' },
    { label: '₹25,000 (OTP)', amount: 25000, category: 'Other', type: 'P2P', warn: true, desc: 'Triggers OTP Challenge' },
    { label: '₹75,000 (Hold)', amount: 75000, category: 'Other', type: 'P2P', danger: true, desc: 'Triggers Admin Freeze' },
  ];

  const filteredHistory = myHistory.filter(h => {
    if (!historySearch) return true;
    const q = historySearch.toLowerCase();
    return (
      h.transaction_reference?.toLowerCase().includes(q) ||
      h.receiver_upi_id?.toLowerCase().includes(q) ||
      h.sender_upi_id?.toLowerCase().includes(q) ||
      h.status?.toLowerCase().includes(q) ||
      h.location_country?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <SendHorizontal className="w-5 h-5 text-blue-600" />
            UPI Instant Transfer & Geofence Security
          </h1>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Real-time Extra Trees inference, behavioral scoring & cross-border VPN geofencing
          </p>
        </div>

        {/* Live Wallet Chip */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 px-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-semibold">
                Available Balance
              </span>
              <span className="text-sm font-bold font-mono text-slate-900">
                ₹{Number(user?.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payer Baseline Profile Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                Authenticated Payer Baseline
              </span>
              <span className="text-[11px] text-slate-300 font-mono">ID: {user?.id}</span>
            </div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <span>{user?.full_name || 'Registered Payer'}</span>
              <span className="text-xs font-mono font-normal text-blue-200">({user?.upi_id})</span>
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300 font-mono pt-1">
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                Home Country: <strong className="text-white">{user?.country || 'India'}</strong>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                State: <strong className="text-white">{user?.state || 'Maharashtra'}</strong>
              </span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Bank: <strong className="text-white">{user?.bank_name || 'State Bank of India'}</strong>
              </span>
              <span className="flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                Acct: <strong className="text-white">{user?.bank_account || 'SBI-Primary'}</strong>
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-purple-400" />
                Age: <strong className="text-white">{user?.age || 28} ({user?.age_group || '26-35'})</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Geofence & VPN Inspection Bar */}
      <div className={`p-4 rounded-xl border transition-all ${
        isCrossBorderAlert
          ? 'bg-amber-50/90 border-amber-300 text-amber-900 shadow-sm'
          : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isCrossBorderAlert ? 'bg-amber-100 text-amber-700' : 'bg-blue-50 text-blue-600'
            }`}>
              {isCrossBorderAlert ? <ShieldAlert className="w-5 h-5 text-amber-600" /> : <Wifi className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider font-mono">
                  Active Geofence Origin:
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold font-mono ${
                  isCrossBorderAlert
                    ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse'
                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                }`}>
                  {activeConnection.country} ({activeConnection.ip})
                  {isCrossBorderAlert ? ' 🚨 VPN / Outbound Anomaly' : ' ✓ Domestic Match'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                {isCrossBorderAlert ? (
                  <span className="text-red-700 font-semibold">
                    Cross-Border Geofence Alert: Connection originates outside {registeredCountry}. High-risk fraud block will trigger!
                  </span>
                ) : (
                  <span>
                    Your active IP is inside {registeredCountry}. Normal domestic UPI settlement rules apply.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* VPN Testing Presets Selector */}
          <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200">
            <span className="text-[11px] font-mono text-slate-500 font-semibold uppercase">
              VPN Test Mode:
            </span>
            <select
              value={vpnMode}
              onChange={(e) => setVpnMode(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs cursor-pointer"
            >
              {VPN_TEST_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
              <option value="custom">⚙️ Custom IP / Location...</option>
            </select>
            {vpnMode === 'auto' && (
              <button
                type="button"
                onClick={detectLiveIp}
                title="Re-detect public IP (e.g. after turning on your VPN app)"
                className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs flex items-center gap-1 font-mono cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Refresh IP</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom VPN IP input if custom is selected */}
        {vpnMode === 'custom' && (
          <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-mono text-slate-600 mb-1">Simulated IP Address</label>
              <input
                type="text"
                placeholder="e.g. 198.51.100.99"
                value={customIp}
                onChange={(e) => setCustomIp(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono shadow-2xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-slate-600 mb-1">Simulated Country</label>
              <input
                type="text"
                placeholder="e.g. United States, Netherlands, Germany"
                value={customCountry}
                onChange={(e) => setCustomCountry(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 shadow-2xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Payment & Audit Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Initiate Payment Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              Initiate UPI Payment
            </h2>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200">
              Live AI Pipeline
            </span>
          </div>

          {/* Quick Test Transfer Scenarios */}
          <div>
            <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1.5 font-semibold">
              Quick Test Transfer Scenarios:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quickAmounts.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    amount_inr: q.amount,
                    merchant_category: q.category,
                    transaction_type: q.type,
                  }))}
                  className={`p-2 rounded-xl border text-[11px] font-mono transition-all text-left cursor-pointer ${
                    q.danger
                      ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-800'
                      : q.warn
                      ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="font-bold">{q.label}</div>
                  <div className="text-[9px] opacity-75">{q.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handlePay} className="space-y-4">
            {/* Payee Selection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Payee – Select Beneficiary <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={fetchRecipients}
                  className="text-[11px] text-blue-600 hover:text-blue-700 flex items-center gap-1 font-mono"
                >
                  <RefreshCw className={`w-3 h-3 ${loadingRecipients ? 'animate-spin' : ''}`} /> Refresh Payees
                </button>
              </div>

              {loadingRecipients ? (
                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-xs text-slate-400 flex items-center gap-2">
                  <RefreshCw className="w-3 h-3 animate-spin" /> Loading registered users...
                </div>
              ) : recipients.length === 0 ? (
                <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>No other payers found in network.</strong>
                    <p className="mt-0.5">Please open another tab or incognito window, click "Register Payer", and register a second recipient account to test transfers.</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <select
                      required
                      value={formData.receiver_upi_id}
                      onChange={(e) => {
                        const rec = recipients.find(r => r.upi_id === e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          receiver_upi_id: e.target.value,
                          receiver_bank: rec?.bank_name || prev.receiver_bank,
                          receiver_age_group: rec?.age_group || prev.receiver_age_group
                        }));
                      }}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 pr-8 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs appearance-none"
                    >
                      <option value="">-- Select Beneficiary --</option>
                      {recipients.map((r) => (
                        <option key={r.upi_id} value={r.upi_id}>
                          {r.full_name} — {r.upi_id} ({r.bank_name || 'Bank'} • {r.country || 'India'})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>

                  {selectedRecipient && (
                    <div className="mt-2.5 flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-700 text-xs">
                          {selectedRecipient.full_name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold block">{selectedRecipient.full_name}</span>
                          <span className="font-mono text-blue-700 text-[11px]">{selectedRecipient.upi_id}</span>
                        </div>
                      </div>
                      <div className="text-right text-[11px] font-mono text-slate-600">
                        <span className="block font-semibold text-slate-800">{selectedRecipient.bank_name || 'HDFC Bank'}</span>
                        <span className="text-[10px] text-slate-500">Region: {selectedRecipient.country || 'India'}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Amount & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount in INR (₹) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold font-mono">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={formData.amount_inr}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount_inr: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Category</label>
                <select
                  value={formData.merchant_category}
                  onChange={(e) => setFormData(prev => ({ ...prev, merchant_category: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                >
                  <option value="Shopping">Shopping</option>
                  <option value="Grocery">Grocery</option>
                  <option value="Food">Food / Dining</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Utilities">Utilities & Bills</option>
                  <option value="Fuel">Fuel / Gas</option>
                  <option value="Transport">Transport</option>
                  <option value="Other">Other / Transfer</option>
                </select>
              </div>
            </div>

            {/* Transaction Type & Bank Institution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Type</label>
                <select
                  value={formData.transaction_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_type: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                >
                  <option value="P2P">P2P (Person-to-Person)</option>
                  <option value="P2M">P2M (Person-to-Merchant)</option>
                  <option value="Bill Payment">Bill Payment</option>
                  <option value="Recharge">Recharge</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Debit Bank</label>
                <select
                  value={formData.sender_bank}
                  onChange={(e) => setFormData(prev => ({ ...prev, sender_bank: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                >
                  <option value="State Bank of India">State Bank of India (SBI)</option>
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                  <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                  <option value="Bank of Baroda">Bank of Baroda</option>
                  <option value="Punjab National Bank">Punjab National Bank</option>
                </select>
              </div>
            </div>

            {/* Device & Network Types */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" /> Device Client
                </label>
                <select
                  value={formData.device_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, device_type: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                >
                  <option value="Android">Android Device (Google Pixel / Samsung)</option>
                  <option value="iOS">Apple iOS (iPhone)</option>
                  <option value="Desktop">Desktop Web Browser</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-slate-400" /> Connection Carrier
                </label>
                <select
                  value={formData.network_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, network_type: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                >
                  <option value="4G">4G LTE Cellular</option>
                  <option value="5G">5G Ultra Broadband</option>
                  <option value="WiFi">Home/Office Wi-Fi</option>
                  <option value="3G">3G Legacy</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || recipients.length === 0}
              className={`w-full py-3 px-4 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                isCrossBorderAlert
                  ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Evaluating Extra Trees AI Risk & Scanning Geofence...</span>
                </>
              ) : (
                <>
                  <SendHorizontal className="w-4 h-4" />
                  <span>
                    {isCrossBorderAlert ? 'Execute Cross-Border Transfer (VPN Alert Test)' : 'Authorize & Transfer Funds'} — ₹{Number(formData.amount_inr).toLocaleString('en-IN')}
                  </span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Real-Time AI Verdict & Receipt */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex-1 flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Security Audit & Model Verdict</h2>
              <span className="text-[10px] font-mono text-blue-600 font-bold uppercase">NPCI Sentinel Gate</span>
            </div>

            {!paymentResult && !loading && (
              <div className="py-16 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 shadow-2xs">
                  <ShieldCheck className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">Ready for Live Transaction</h3>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Every transfer is verified against your registered geofence baseline ({registeredCountry}) and evaluated by the Extra Trees classifier.
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-mono">
                    <Clock className="w-3 h-3" /> System Time: {formatIST(new Date().toISOString())}
                  </span>
                </div>
              </div>
            )}

            {paymentResult && (
              <div className="space-y-4 my-auto py-2">
                {/* Result Status Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-center gap-3.5 ${
                    paymentResult.status === 'APPROVED'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : paymentResult.status === 'PENDING_OTP'
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-red-50 border-red-300 text-red-900'
                  }`}
                >
                  {paymentResult.status === 'APPROVED' ? (
                    <CheckCircle2 className="w-9 h-9 text-emerald-600 shrink-0" />
                  ) : paymentResult.status === 'PENDING_OTP' ? (
                    <KeyRound className="w-9 h-9 text-amber-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-9 h-9 text-red-600 shrink-0" />
                  )}
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider block font-bold opacity-80">
                      {paymentResult.status === 'APPROVED' ? 'Instant Settlement' : 'Risk Interception'}
                    </span>
                    <h3 className="text-base font-bold font-mono">
                      {paymentResult.status === 'APPROVED'
                        ? 'Payment Approved & Settled'
                        : paymentResult.status === 'PENDING_OTP'
                        ? 'Step-Up OTP Challenge'
                        : 'Held for Security Admin Review'}
                    </h3>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Transaction Reference:</span>
                    <span className="font-mono text-blue-700 font-bold">{paymentResult.transaction_reference}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Beneficiary:</span>
                    <span className="font-mono font-bold text-slate-900">{paymentResult.receiver_name}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">AI Fraud Probability:</span>
                    <span className="font-mono font-bold text-slate-900">{paymentResult.fraud_probability}</span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span className="text-slate-500">Risk Assessment Score:</span>
                    <span className="font-mono font-bold text-amber-600">{paymentResult.risk_percentage}%</span>
                  </div>
                  {paymentResult.location_country && (
                    <div className="flex justify-between text-slate-700">
                      <span className="text-slate-500">Detected Origin:</span>
                      <span className={`font-mono font-bold ${paymentResult.is_international ? 'text-red-600' : 'text-emerald-600'}`}>
                        {paymentResult.location_country} ({paymentResult.ip_address || 'N/A'}) {paymentResult.is_international ? '🚨 Foreign Gateway' : '✓ Domestic'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-700 pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Logged Timestamp (IST):</span>
                    <span className="font-mono text-slate-800 font-semibold">
                      {formatIST(new Date().toISOString())}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono uppercase text-slate-600 font-bold block mb-1">
                    Decision Explanation:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {paymentResult.explanation}
                  </p>
                </div>

                {paymentResult.status === 'PENDING_ADMIN_REVIEW' && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs">
                    <div className="font-bold mb-1 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-700" /> Admin Review Ticket Dispatched
                    </div>
                    {paymentResult.is_international
                      ? 'Because your connection originated from outside your registered home country (e.g. foreign VPN exit node), the transfer was frozen to prevent cross-border leakage. It is waiting in the SOC Admin Review Portal.'
                      : 'As per security policy, high-risk transfers are placed on temporary security hold. An administrator will review and either release or reject the transfer in the SOC portal.'}
                  </div>
                )}
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-mono flex items-center justify-between">
              <span>Standard Time: IST (UTC+05:30)</span>
              <span>ISO-20022 Compliant</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Transaction History Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">My Transfer Records & Receipts</h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
              {filteredHistory.length} Transactions
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search by ref, UPI ID, status..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              onClick={fetchHistory}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold px-2 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] bg-slate-50/70">
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Flow</th>
                <th className="py-2.5 px-3">Counterparty</th>
                <th className="py-2.5 px-3">Amount (INR)</th>
                <th className="py-2.5 px-3">Location / Geofence</th>
                <th className="py-2.5 px-3">Risk %</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Timestamp (IST)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-blue-300" />
                    No transactions found. Use the transfer form above to test real-time scoring.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-semibold text-slate-800">{h.transaction_reference}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        h.is_credit
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {h.is_credit ? '↓ Inflow' : '↑ Outflow'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {h.is_credit ? h.sender_upi_id : h.receiver_upi_id}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      <span className={h.is_credit ? 'text-emerald-700' : 'text-slate-900'}>
                        {h.is_credit ? '+' : '-'}₹{h.amount_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      <span className={`inline-flex items-center gap-1 font-semibold ${
                        h.is_international ? 'text-red-700' : 'text-slate-700'
                      }`}>
                        {h.location_country || 'India'}
                        {h.is_international && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-red-100 text-red-800 border border-red-300">
                            VPN Alert
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={`${h.risk_percentage >= 28.5 ? 'text-amber-600' : 'text-emerald-600'} font-bold`}>
                        {h.risk_percentage}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                        h.status === 'APPROVED' || h.status === 'ADMIN_APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : h.status === 'PENDING_OTP'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : h.status === 'PENDING_ADMIN_REVIEW'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {h.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {formatIST(h.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulated OTP Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600">
                <KeyRound className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">Step-Up OTP Challenge</h3>
              </div>
              <button onClick={() => setShowOtpModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Your transaction reached the Step-Up OTP risk threshold. Enter the 6-digit verification code sent to your registered device.
            </p>

            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-mono">
              <span className="font-bold block mb-0.5">Demo Simulation OTP Code:</span>
              <span className="text-lg font-black tracking-widest text-amber-800">{demoOtpHint}</span>
              <span className="text-[10px] text-slate-500 block mt-1">(Pre-filled hint for hackathon evaluation)</span>
            </div>

            {otpError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
                {otpError}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-slate-500 mb-1">Enter 6-Digit OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="e.g. 749281"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-center text-lg font-mono tracking-widest font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="px-3 py-2 text-xs text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {otpLoading ? 'Verifying OTP...' : 'Verify & Complete Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserPaymentPage;
