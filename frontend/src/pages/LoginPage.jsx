import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  MapPin,
  Building2,
  CreditCard,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const POPULAR_COUNTRIES = [
  { code: 'IN', name: 'India', flag: '🇮🇳' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
];

const INDIAN_STATES = [
  'Maharashtra',
  'Karnataka',
  'Delhi',
  'Tamil Nadu',
  'Gujarat',
  'Uttar Pradesh',
  'Telangana',
  'West Bengal',
  'Kerala',
  'Rajasthan',
  'Haryana',
  'Punjab',
  'Madhya Pradesh',
  'Andhra Pradesh',
  'Bihar'
];

const POPULAR_BANKS = [
  'State Bank of India',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Punjab National Bank',
  'Kotak Mahindra Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'IndusInd Bank'
];

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    upi_id: '',
    role: 'user',
    country: 'India',
    state: 'Maharashtra',
    age: 28,
    bank_name: 'State Bank of India',
    bank_account: '',
  });

  // Calculate age group dynamically
  const getAgeGroup = (age) => {
    const a = parseInt(age, 10);
    if (isNaN(a) || a <= 0) return '26-35';
    if (a <= 25) return '18-25';
    if (a <= 35) return '26-35';
    if (a <= 50) return '36-50';
    return '50+';
  };

  const handleQuickFill = (profileType) => {
    if (profileType === 'indian') {
      const rand = Math.floor(1000 + Math.random() * 9000);
      setFormData({
        email: `rohit.sharma${rand}@gmail.com`,
        password: 'Password@123',
        full_name: 'Rohit Sharma',
        upi_id: `rohit${rand}@upisentinel`,
        role: 'user',
        country: 'India',
        state: 'Maharashtra',
        age: 29,
        bank_name: 'State Bank of India',
        bank_account: `SBI00${rand}9281`,
      });
    } else if (profileType === 'us_resident') {
      const rand = Math.floor(1000 + Math.random() * 9000);
      setFormData({
        email: `john.doe${rand}@gmail.com`,
        password: 'Password@123',
        full_name: 'Johnathan Doe',
        upi_id: `johndoe${rand}@upisentinel`,
        role: 'user',
        country: 'United States',
        state: 'New York',
        age: 34,
        bank_name: 'JPMorgan Chase Bank',
        bank_account: `CHASE99${rand}1`,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        if (!formData.bank_account) {
          const defaultAcct = `ACCT${Math.floor(100000000 + Math.random() * 900000000)}`;
          await register({ ...formData, bank_account: defaultAcct });
        } else {
          await register(formData);
        }
      } else {
        await login(formData.email, formData.password);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await login('admin@upisentinel.com', 'Admin@2024');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to authenticate admin account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-100 rounded-full blur-3xl pointer-events-none opacity-60" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-100 rounded-full blur-3xl pointer-events-none opacity-60" />

      <div className={`w-full relative z-10 transition-all duration-300 ${isRegister ? 'max-w-2xl' : 'max-w-md'}`}>
        {/* Header Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex h-13 w-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center justify-center gap-2">
            UPI Sentinel
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
              v2.0 AI Core
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            Real-Time AI-Powered Digital Payment Security & Geofencing
          </p>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-200">
          {/* Tabs */}
          <div className="flex rounded-xl bg-slate-100 p-1 mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => { setIsRegister(false); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                !isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In to Account
            </button>
            <button
              type="button"
              onClick={() => { setIsRegister(true); setError(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                isRegister ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Register New Payer Profile
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {/* Quick Fill Presets for Registration */}
          {isRegister && (
            <div className="mb-5 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-blue-900 flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-mono">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Quick Demo Autofill (Evaluator Presets)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('indian')}
                  className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-blue-100/70 border border-blue-200 text-blue-800 text-[11px] font-medium transition-all text-left flex items-center gap-2 shadow-2xs"
                >
                  <span className="text-sm">🇮🇳</span>
                  <span>Indian Resident (Maharashtra)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('us_resident')}
                  className="py-1.5 px-2.5 rounded-lg bg-white hover:bg-blue-100/70 border border-blue-200 text-blue-800 text-[11px] font-medium transition-all text-left flex items-center gap-2 shadow-2xs"
                >
                  <span className="text-sm">🇺🇸</span>
                  <span>US Resident (Cross-Border Test)</span>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Fields */}
            {isRegister && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Legal Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Malhotra"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UPI ID (Virtual Payment Address)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. vikram@upisentinel (optional)"
                    value={formData.upi_id}
                    onChange={(e) => setFormData({ ...formData, upi_id: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Leave blank to auto-generate</p>
                </div>
              </div>
            )}

            <div className={isRegister ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-4"}>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* Registration Specific: Country, State, Age, Bank Account */}
            {isRegister && (
              <>
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      Geofence Baseline & Profile Details
                    </span>
                    <span className="text-[10px] text-slate-400">Used for cross-border VPN anomaly scoring</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Country */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Country <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                        >
                          {POPULAR_COUNTRIES.map((c) => (
                            <option key={c.code} value={c.name}>
                              {c.flag} {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* State */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        State / Province <span className="text-red-500">*</span>
                      </label>
                      {formData.country === 'India' ? (
                        <select
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                        >
                          {INDIAN_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            required
                            placeholder="e.g. New York, California"
                            value={formData.state}
                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                            className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* Age */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-slate-700">
                          Age <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200">
                          Tier: {getAgeGroup(formData.age)}
                        </span>
                      </div>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="number"
                          required
                          min="18"
                          max="100"
                          value={formData.age}
                          onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 18 })}
                          className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banking Information */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      Banking Identification
                    </span>
                    <span className="text-[10px] text-emerald-600 font-medium">₹5,00,000 Sandbox Balance Included</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Bank Name */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Bank Institution <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.bank_name}
                        onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                      >
                        {POPULAR_BANKS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>

                    {/* Bank Account */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Bank Account Number <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. SBI0083920199"
                          value={formData.bank_account}
                          onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                          className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 p-2 rounded-lg bg-amber-50/70 border border-amber-200 text-[11px] text-amber-800 flex items-start gap-1.5">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Cross-Border Test Guarantee:</strong> When transacting, our AI will check your network IP against your registered country ({formData.country}). Using a VPN outside {formData.country} will instantly trigger a geofence alert!
                    </span>
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              {loading ? 'Processing...' : isRegister ? 'Complete Registration & Enter Console' : 'Access Sentinel Console'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Admin Quick Access */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-mono text-slate-500 text-center mb-3 uppercase tracking-wider flex items-center justify-center gap-1.5 font-medium">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              Evaluation Shortcut
            </p>
            <button
              type="button"
              onClick={handleAdminLogin}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold transition-all flex flex-col items-center justify-center gap-0.5 disabled:opacity-50 cursor-pointer shadow-2xs"
            >
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                1-Click Security Admin / SOC Login
              </span>
              <span className="text-[10px] text-amber-700 font-mono">
                admin@upisentinel.com — View Held Cross-Border & Risky Transactions
              </span>
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 text-center text-[11px] text-slate-400 font-mono flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>KLU + Path-3 ML-02 UPI Fraud Detection System</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
