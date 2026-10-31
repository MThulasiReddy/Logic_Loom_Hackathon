import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  MessageSquare,
  Sliders,
  Save,
  Info,
  Globe,
  RotateCcw
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatIST } from '../utils/date';

const AdminReviewPage = () => {
  const { user } = useAuth();
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [message, setMessage] = useState(null);

  // Threshold management state
  const [thresholds, setThresholds] = useState({ block_threshold: 0.571, otp_threshold: 0.2855 });
  const [thresholdDraft, setThresholdDraft] = useState({ block_threshold: 0.571, otp_threshold: 0.2855 });
  const [loadingThresholds, setLoadingThresholds] = useState(true);
  const [savingThresholds, setSavingThresholds] = useState(false);
  const [thresholdMsg, setThresholdMsg] = useState(null);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/admin/pending-reviews');
      setPendingItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchThresholds = async () => {
    try {
      setLoadingThresholds(true);
      const res = await apiClient.get('/api/admin/thresholds');
      const t = {
        block_threshold: res.data.block_threshold,
        otp_threshold: res.data.otp_threshold
      };
      setThresholds(t);
      setThresholdDraft(t);
    } catch (err) {
      console.error('Failed to fetch thresholds', err);
    } finally {
      setLoadingThresholds(false);
    }
  };

  useEffect(() => {
    fetchPending();
    fetchThresholds();
  }, []);

  const handleReviewAction = async (transactionId, action) => {
    try {
      setActionLoading(transactionId);
      const notes = adminNotes[transactionId] || '';
      await apiClient.post('/api/admin/review', {
        transaction_id: transactionId,
        action: action,
        admin_notes: notes
      });

      setMessage({
        type: action === 'APPROVE' ? 'success' : 'danger',
        text: `Transaction #${transactionId} has been successfully ${action === 'APPROVE' ? 'APPROVED & funds released' : 'REJECTED & blocked'}.`
      });

      setPendingItems(pendingItems.filter(p => p.id !== transactionId));
    } catch (err) {
      setMessage({
        type: 'danger',
        text: err.response?.data?.detail || 'Failed to complete review action.'
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    if (thresholdDraft.otp_threshold >= thresholdDraft.block_threshold) {
      setThresholdMsg({ type: 'danger', text: 'Step-Up OTP threshold must be strictly less than the Block threshold.' });
      return;
    }
    try {
      setSavingThresholds(true);
      await apiClient.post('/api/admin/thresholds', {
        block_threshold: parseFloat(thresholdDraft.block_threshold),
        otp_threshold: parseFloat(thresholdDraft.otp_threshold)
      });
      setThresholds({ ...thresholdDraft });
      setThresholdMsg({ type: 'success', text: `Thresholds updated: OTP ≥ ${(thresholdDraft.otp_threshold * 100).toFixed(2)}% | Block ≥ ${(thresholdDraft.block_threshold * 100).toFixed(2)}%` });
    } catch (err) {
      setThresholdMsg({ type: 'danger', text: err.response?.data?.detail || 'Failed to save thresholds.' });
    } finally {
      setSavingThresholds(false);
    }
  };

  const handleResetThresholds = async () => {
    const defaults = { block_threshold: 0.571, otp_threshold: 0.2855 };
    setThresholdDraft(defaults);
    try {
      setSavingThresholds(true);
      await apiClient.post('/api/admin/thresholds', defaults);
      setThresholds(defaults);
      setThresholdMsg({ type: 'success', text: 'Thresholds reset to model-recommended defaults.' });
    } catch (err) {
      setThresholdMsg({ type: 'danger', text: 'Failed to reset thresholds.' });
    } finally {
      setSavingThresholds(false);
    }
  };

  const totalHeldVolume = pendingItems.reduce((acc, curr) => acc + curr.amount_inr, 0);

  const SliderInput = ({ label, hint, value, min, max, step, onChange }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700">{label}</label>
        <span className="text-sm font-bold font-mono text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
          {(value * 100).toFixed(2)}%
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-[10px] font-mono text-slate-400">
        <span>{(min * 100).toFixed(0)}%</span>
        <span className="text-slate-500 text-center text-[10px]">{hint}</span>
        <span>{(max * 100).toFixed(0)}%</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-500" />
              SOC Security Officer Review Portal
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200 rounded-full font-semibold">
              Admin Exclusive
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit high-risk and flagged UPI transfers. Authorize release or institute administrative block.
          </p>
        </div>

        <button
          onClick={fetchPending}
          disabled={loading}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* ============================== THRESHOLD MANAGEMENT PANEL ============================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-200 bg-slate-50">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-semibold text-slate-900">Fraud Decision Threshold Controls</h2>
          <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700 font-semibold">
            Live ML Engine Config
          </span>
        </div>

        <div className="p-5">
          {loadingThresholds ? (
            <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
              Loading current threshold configuration...
            </div>
          ) : (
            <form onSubmit={handleSaveThresholds} className="space-y-5">
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <strong>How thresholds work:</strong> When the ML model's fraud probability score for a transaction
                  exceeds the <strong>OTP Threshold</strong>, it triggers a step-up authentication challenge.
                  If it exceeds the <strong>Block Threshold</strong>, the transaction is frozen and sent here for review.
                  Adjust these cutoffs to tune the sensitivity of the fraud detection system.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* OTP Threshold */}
                <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-amber-800">Step-Up OTP Threshold</span>
                  </div>
                  <SliderInput
                    label="OTP Challenge Trigger"
                    hint="Moderate-risk band"
                    value={thresholdDraft.otp_threshold}
                    min={0.05}
                    max={0.5}
                    step={0.005}
                    onChange={(e) => setThresholdDraft(prev => ({ ...prev, otp_threshold: parseFloat(e.target.value) }))}
                  />
                  <p className="text-[10px] text-amber-700">
                    Currently: <strong>{(thresholds.otp_threshold * 100).toFixed(2)}%</strong> (saved) — 
                    Draft: <strong>{(thresholdDraft.otp_threshold * 100).toFixed(2)}%</strong>
                  </p>
                </div>

                {/* Block Threshold */}
                <div className="p-4 rounded-xl border border-red-200 bg-red-50 space-y-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <span className="text-xs font-bold text-red-800">Block & Admin Review Threshold</span>
                  </div>
                  <SliderInput
                    label="Transaction Block Trigger"
                    hint="High-risk freeze band"
                    value={thresholdDraft.block_threshold}
                    min={0.1}
                    max={0.95}
                    step={0.005}
                    onChange={(e) => setThresholdDraft(prev => ({ ...prev, block_threshold: parseFloat(e.target.value) }))}
                  />
                  <p className="text-[10px] text-red-700">
                    Currently: <strong>{(thresholds.block_threshold * 100).toFixed(2)}%</strong> (saved) — 
                    Draft: <strong>{(thresholdDraft.block_threshold * 100).toFixed(2)}%</strong>
                  </p>
                </div>
              </div>

              {/* Threshold visual indicator */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-mono text-slate-500 mb-2 font-semibold uppercase">Risk Decision Zones Preview</p>
                <div className="flex h-5 rounded-full overflow-hidden text-[9px] font-mono font-bold">
                  <div
                    className="bg-emerald-500 flex items-center justify-center text-white"
                    style={{ width: `${thresholdDraft.otp_threshold * 100}%` }}
                  >
                    SAFE
                  </div>
                  <div
                    className="bg-amber-400 flex items-center justify-center text-white"
                    style={{ width: `${(thresholdDraft.block_threshold - thresholdDraft.otp_threshold) * 100}%` }}
                  >
                    OTP
                  </div>
                  <div
                    className="bg-red-500 flex items-center justify-center text-white flex-1"
                  >
                    BLOCK
                  </div>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                  <span>0%</span>
                  <span className="text-amber-600">OTP: {(thresholdDraft.otp_threshold * 100).toFixed(1)}%</span>
                  <span className="text-red-600">Block: {(thresholdDraft.block_threshold * 100).toFixed(1)}%</span>
                  <span>100%</span>
                </div>
              </div>

              {thresholdMsg && (
                <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                  thresholdMsg.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  <span>{thresholdMsg.text}</span>
                  <button onClick={() => setThresholdMsg(null)} className="font-bold underline text-[11px] shrink-0 ml-2">Dismiss</button>
                </div>
              )}

              <div className="flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={handleResetThresholds}
                  disabled={savingThresholds}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-600 font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset to Model Defaults (57.1% / 28.55%)
                </button>

                <button
                  type="submit"
                  disabled={savingThresholds}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50"
                >
                  {savingThresholds ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {savingThresholds ? 'Saving...' : 'Save Thresholds'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ============================== SUMMARY KPI STRIP ============================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-slate-500 block font-medium">Pending Review Count</span>
          <div className="text-2xl font-bold font-mono text-amber-600 mt-1">{pendingItems.length}</div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Held for manual authorization</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-slate-500 block font-medium">Total Funds on Hold</span>
          <div className="text-2xl font-bold font-mono text-blue-700 mt-1">
            ₹{totalHeldVolume.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">Safeguarded payer capital</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-[10px] font-mono uppercase text-slate-500 block font-medium">Active Model Policy</span>
          <div className="text-sm font-bold font-mono text-slate-900 mt-2">Extra Trees (16 features)</div>
          <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
            OTP: {(thresholds.otp_threshold * 100).toFixed(1)}% | Block: {(thresholds.block_threshold * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {message && (
        <div className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
          message.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)} className="font-bold underline text-[11px]">Dismiss</button>
        </div>
      )}

      {/* ============================== PENDING ITEMS LIST ============================== */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
            Scanning queue for pending administrative reviews...
          </div>
        ) : pendingItems.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-sm space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-semibold text-slate-900">Queue Clear – No Pending Security Holds</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All transactions have been reviewed or are nominal risk. To simulate a hold, send an elevated amount (above ₹50,000) from the UPI Pay page, or use a VPN to trigger a cross-border geofence alert.
            </p>
          </div>
        ) : (
          pendingItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm hover:border-amber-400 transition-all space-y-4"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    item.is_international
                      ? 'bg-purple-100 text-purple-700'
                      : item.decision === 'BLOCK'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {item.is_international ? <Globe className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900">{item.transaction_reference}</span>
                      {item.is_international && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-100 text-purple-700 border border-purple-200">
                          🌐 International / VPN
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        item.status === 'BLOCKED'
                          ? 'bg-red-100 text-red-700 border border-red-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Logged: {formatIST(item.created_at)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xl font-bold font-mono text-slate-900">
                    ₹{item.amount_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    <span className="text-[11px] font-mono text-slate-500">Risk Score:</span>
                    <span className="text-xs font-mono font-bold text-amber-600">{item.risk_percentage}%</span>
                    <span className="text-[10px] text-slate-400 font-mono">({item.fraud_probability?.toFixed(4)})</span>
                  </div>
                </div>
              </div>

              {/* Transaction Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">Sender UPI / Bank</span>
                  <span className="text-slate-800 font-medium">{item.sender_upi_id || 'user@upisentinel'} ({item.sender_bank})</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Receiver UPI / Bank</span>
                  <span className="text-slate-800 font-medium">{item.receiver_upi_id || 'recv@upisentinel'} ({item.receiver_bank})</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Type & Category</span>
                  <span className="text-slate-800 font-medium">{item.transaction_type} • {item.merchant_category}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Origin IP / Location</span>
                  <span className={`font-medium ${item.is_international ? 'text-purple-700' : 'text-emerald-700'}`}>
                    {item.ip_address || 'N/A'} — {item.location_country || 'India'}
                  </span>
                </div>
              </div>

              {/* AI Explanation */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="text-[10px] uppercase font-mono text-blue-700 font-bold block mb-1">
                  Extra Trees Model Decision Factors:
                </span>
                <p className="leading-relaxed">{item.explanation}</p>
              </div>

              {/* Review Actions & Admin Note */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div className="w-full sm:w-1/2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Add audit reason or compliance note..."
                    value={adminNotes[item.id] || ''}
                    onChange={(e) => setAdminNotes({ ...adminNotes, [item.id]: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-sm"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleReviewAction(item.id, 'REJECT')}
                    disabled={actionLoading === item.id}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject & Block Payment
                  </button>

                  <button
                    onClick={() => handleReviewAction(item.id, 'APPROVE')}
                    disabled={actionLoading === item.id}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {actionLoading === item.id ? 'Processing...' : 'Approve & Release Funds'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminReviewPage;
