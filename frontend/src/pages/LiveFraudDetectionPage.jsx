import React, { useState } from 'react';
import {
  Flame,
  Zap,
  ShieldCheck,
  AlertTriangle,
  Ban,
  ArrowRight,
  Cpu,
  Clock,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';
import apiClient from '../api/client';

const TRANSACTION_TYPES = ['P2P', 'P2M', 'Bill Payment', 'Recharge'];
const MERCHANT_CATEGORIES = ['Shopping', 'Grocery', 'Fuel', 'Entertainment', 'Food', 'Utilities', 'Transport', 'Education', 'Healthcare', 'Other'];
const AGE_GROUPS = ['18-25', '26-35', '36-45', '46-55', '56+'];
const STATES = ['Maharashtra', 'Karnataka', 'Delhi', 'Telangana', 'Gujarat', 'Rajasthan', 'Tamil Nadu', 'Uttar Pradesh', 'Andhra Pradesh', 'West Bengal'];
const BANKS = ['SBI', 'HDFC', 'ICICI', 'Axis', 'Kotak', 'PNB', 'IndusInd', 'Yes Bank'];
const DEVICES = ['Android', 'iOS', 'Web'];
const NETWORKS = ['4G', '5G', 'WiFi', '3G'];

const LiveFraudDetectionPage = () => {
  const [formData, setFormData] = useState({
    transaction_type: 'P2P',
    merchant_category: 'Shopping',
    amount_inr: 4500,
    sender_age_group: '26-35',
    receiver_age_group: '26-35',
    sender_state: 'Maharashtra',
    sender_bank: 'SBI',
    receiver_bank: 'HDFC',
    device_type: 'Android',
    network_type: '4G',
    txn_hour: new Date().getHours(),
    day_of_week: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1,
    sender_upi_id: 'user@oksbi',
    receiver_upi_id: 'store@okhdfc'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const applyPreset = (preset) => {
    if (preset === 'safe') {
      setFormData({
        transaction_type: 'P2M',
        merchant_category: 'Grocery',
        amount_inr: 850,
        sender_age_group: '26-35',
        receiver_age_group: '36-45',
        sender_state: 'Maharashtra',
        sender_bank: 'HDFC',
        receiver_bank: 'SBI',
        device_type: 'Android',
        network_type: '5G',
        txn_hour: 14,
        day_of_week: 2,
        sender_upi_id: 'payer@okhdfc',
        receiver_upi_id: 'grocery_mart@oksbi'
      });
    } else if (preset === 'otp_moderate') {
      setFormData({
        transaction_type: 'P2P',
        merchant_category: 'Other',
        amount_inr: 28000,
        sender_age_group: '18-25',
        receiver_age_group: '56+',
        sender_state: 'Delhi',
        sender_bank: 'Axis',
        receiver_bank: 'PNB',
        device_type: 'Web',
        network_type: 'WiFi',
        txn_hour: 23,
        day_of_week: 5,
        sender_upi_id: 'user99@okaxis',
        receiver_upi_id: 'peer44@okpnb'
      });
    } else if (preset === 'high_risk') {
      setFormData({
        transaction_type: 'P2P',
        merchant_category: 'Other',
        amount_inr: 95000,
        sender_age_group: '18-25',
        receiver_age_group: '56+',
        sender_state: 'West Bengal',
        sender_bank: 'Yes Bank',
        receiver_bank: 'Axis',
        device_type: 'Web',
        network_type: '3G',
        txn_hour: 3,
        day_of_week: 6,
        sender_upi_id: 'suspicious_peer@okyes',
        receiver_upi_id: 'unknown_wallet@okaxis'
      });
    }
    setResult(null);
  };

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await apiClient.post('/api/predict', formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Inference call failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Title */}
      <div className="pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-blue-600" />
            Live Fraud Detection Sandbox
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Test any transaction payload directly against the trained Extra Trees pipeline with zero fake heuristics
          </p>
        </div>

        {/* Preset quick buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500 uppercase font-medium">Test Presets:</span>
          <button
            type="button"
            onClick={() => applyPreset('safe')}
            className="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all font-semibold"
          >
            Safe Grocery (₹850)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('otp_moderate')}
            className="px-2.5 py-1 text-xs rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all font-semibold"
          >
            Elevated Weekend (₹28k)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('high_risk')}
            className="px-2.5 py-1 text-xs rounded-lg bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 transition-all font-semibold"
          >
            Night Anomaly (₹95k)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form (7 cols) */}
        <form onSubmit={handlePredict} className="lg:col-span-7 bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              Transaction Features Configuration
            </h2>
            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
              16 Features Pipeline
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Transaction Type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Transaction Type</label>
              <select
                value={formData.transaction_type}
                onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Merchant Category */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Merchant Category</label>
              <select
                value={formData.merchant_category}
                onChange={(e) => setFormData({ ...formData, merchant_category: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                {MERCHANT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Amount (INR ₹)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                required
                value={formData.amount_inr}
                onChange={(e) => setFormData({ ...formData, amount_inr: parseFloat(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>

            {/* Transaction Hour */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Transaction Hour (0 - 23 hrs)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={formData.txn_hour}
                onChange={(e) => setFormData({ ...formData, txn_hour: parseInt(e.target.value) || 0 })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:border-blue-500 shadow-sm"
              />
            </div>

            {/* Sender Bank */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Sender Bank</label>
              <select
                value={formData.sender_bank}
                onChange={(e) => setFormData({ ...formData, sender_bank: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Receiver Bank */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Receiver Bank</label>
              <select
                value={formData.receiver_bank}
                onChange={(e) => setFormData({ ...formData, receiver_bank: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {/* Sender Age Group */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Sender Age Bracket</label>
              <select
                value={formData.sender_age_group}
                onChange={(e) => setFormData({ ...formData, sender_age_group: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Receiver Age Group */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Receiver Age Bracket</label>
              <select
                value={formData.receiver_age_group}
                onChange={(e) => setFormData({ ...formData, receiver_age_group: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                {AGE_GROUPS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Sender State */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Sender State</label>
              <select
                value={formData.sender_state}
                onChange={(e) => setFormData({ ...formData, sender_state: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Device Type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Device Platform</label>
              <select
                value={formData.device_type}
                onChange={(e) => setFormData({ ...formData, device_type: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                {DEVICES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            {/* Network Type */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Network Connection</label>
              <select
                value={formData.network_type}
                onChange={(e) => setFormData({ ...formData, network_type: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                {NETWORKS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>

            {/* Day of Week */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Day of Week</label>
              <select
                value={formData.day_of_week}
                onChange={(e) => setFormData({ ...formData, day_of_week: parseInt(e.target.value) })}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-500 shadow-sm"
              >
                <option value={0}>Monday (Weekday)</option>
                <option value={1}>Tuesday (Weekday)</option>
                <option value={2}>Wednesday (Weekday)</option>
                <option value={3}>Thursday (Weekday)</option>
                <option value={4}>Friday (Weekday)</option>
                <option value={5}>Saturday (Weekend)</option>
                <option value={6}>Sunday (Weekend)</option>
              </select>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Computing Extra Trees Classifier Probability...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute ML Real-Time Fraud Assessment</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Result Analysis Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex-1 flex flex-col justify-between">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                Inference Result & Risk Verdict
              </h2>
              <span className="text-[10px] font-mono text-slate-500">
                Extra Trees (class_weight)
              </span>
            </div>

            {loading && (
              <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-blue-600 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-slate-900">Evaluating Behavioral Embeddings</h3>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    Cyclic time transforms, bank routing, age matrix evaluation...
                  </p>
                </div>
              </div>
            )}

            {!loading && !result && !error && (
              <div className="py-20 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <Cpu className="w-6 h-6" />
                </div>
                <h3 className="text-xs font-semibold text-slate-700">Awaiting Transaction Submission</h3>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                  Select a test preset above or enter custom parameters and click execute to view live ML probability.
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs my-auto">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <Ban className="w-4 h-4" /> Inference Failure
                </div>
                {error}
              </div>
            )}

            {!loading && result && (
              <div className="space-y-4 animate-in fade-in duration-300 my-auto py-2">
                {/* Decision Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    result.decision === 'APPROVE'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : result.decision === 'STEP_UP_OTP'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.decision === 'APPROVE' ? (
                      <ShieldCheck className="w-7 h-7 text-emerald-600 shrink-0" />
                    ) : result.decision === 'STEP_UP_OTP' ? (
                      <AlertTriangle className="w-7 h-7 text-amber-600 shrink-0" />
                    ) : (
                      <Ban className="w-7 h-7 text-red-600 shrink-0" />
                    )}
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest block opacity-75 font-semibold">
                        Verdict
                      </span>
                      <h3 className="text-lg font-bold font-mono tracking-tight">{result.decision}</h3>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[10px] opacity-75 block">Status</span>
                    <span className="text-xs font-bold">{result.status}</span>
                  </div>
                </div>

                {/* Probability Gauges */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block font-medium">
                      ML Fraud Probability
                    </span>
                    <div className="text-xl font-bold font-mono text-blue-700 mt-1">
                      {result.fraud_probability}
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">predict_proba(X)[1]</span>
                  </div>

                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-mono text-slate-500 block font-medium">
                      Assessed Risk Score
                    </span>
                    <div className="text-xl font-bold font-mono text-slate-900 mt-1">
                      {result.risk_percentage}%
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">Normalized scale</span>
                  </div>
                </div>

                {/* Threshold comparison progress bar */}
                <div className="space-y-1.5 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex justify-between text-[11px] font-mono text-slate-700">
                    <span>Threshold Alignment</span>
                    <span className="font-bold">{result.risk_percentage}% / 100%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden relative">
                    <div
                      className={`h-full transition-all duration-700 ${
                        result.decision === 'APPROVE'
                          ? 'bg-emerald-500'
                          : result.decision === 'STEP_UP_OTP'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(result.risk_percentage, 100)}%` }}
                    />
                    <div className="absolute top-0 bottom-0 left-[28.55%] w-0.5 bg-amber-500" title="OTP Cutoff: 28.55%" />
                    <div className="absolute top-0 bottom-0 left-[57.1%] w-0.5 bg-red-500" title="Block Cutoff: 57.1%" />
                  </div>
                  <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-1">
                    <span>0% (Safe)</span>
                    <span className="text-amber-700 font-semibold">OTP: 28.5%</span>
                    <span className="text-red-700 font-semibold">Block: 57.1%</span>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-mono uppercase text-blue-700 block mb-1 font-bold">
                    AI Decision Rationale & Explanation
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {result.explanation}
                  </p>
                </div>

                <div className="text-[10px] font-mono text-slate-400 flex justify-between">
                  <span>Ref: {result.transaction_reference}</span>
                  <span>Persisted in DB: Yes</span>
                </div>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-mono flex items-center justify-between">
              <span>Pipeline: Scikit-learn Joblib</span>
              <span>Class Weight: Balanced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFraudDetectionPage;
