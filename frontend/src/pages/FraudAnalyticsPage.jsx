import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  Clock,
  Layers,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart
} from 'recharts';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const FraudAnalyticsPage = () => {
  const { user, isAdmin } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/api/analytics/overview');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-600">Synthesizing Machine Learning Telemetry...</span>
        </div>
      </div>
    );
  }

  const decisionPieData = data?.decision_distribution
    ? Object.entries(data.decision_distribution)
        .filter(([_, val]) => val > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  const DECISION_COLORS = {
    APPROVE: '#10B981',
    STEP_UP_OTP: '#F59E0B',
    BLOCK: '#EF4444'
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Fraud Risk Telemetry & Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical behavioral distributions, amount exposure tiers, and cyclical time risk curves
          </p>
        </div>

        <button
          onClick={fetchAnalytics}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium transition-colors shadow-sm"
        >
          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
          Refresh Metrics
        </button>
      </div>

      {/* Critical Methodology Note Box */}
      <div className="bg-blue-50/70 rounded-xl p-4 border border-blue-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 space-y-1">
          <span className="font-bold text-blue-900 font-mono block">Data Integrity & Leakage Prevention Notice:</span>
          <p className="leading-relaxed">
            All charts on this dashboard display <span className="text-slate-900 font-bold">real ML model predictions</span> produced by the trained Extra Trees pipeline. Potential data leakage columns (<code className="text-blue-700 font-mono font-semibold">transaction_status</code>, <code className="text-blue-700 font-mono font-semibold">fraud_flag</code>, and <code className="text-blue-700 font-mono font-semibold">transaction id</code>) are strictly excluded from inference features to maintain production rigor.
          </p>
        </div>
      </div>

      {/* Grid: 2 Top Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Decision Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Model Decision Distribution</h2>
            <span className="text-[10px] font-mono text-slate-500">Trained Thresholds</span>
          </div>

          <div className="h-64 flex items-center justify-center">
            {decisionPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={decisionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {decisionPieData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={DECISION_COLORS[entry.name] || '#3B82F6'}
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2E8F0',
                      borderRadius: '8px',
                      fontSize: '11px',
                      color: '#0F172A',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend verticalAlign="bottom" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-slate-400">No transactions recorded yet</div>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-100 flex justify-between">
            <span>Low Risk: APPROVE</span>
            <span>OTP Cutoff: STEP_UP_OTP</span>
          </div>
        </div>

        {/* Risk by Transaction Type (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Average Risk Score by Transaction Type</h2>
            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
              P2P vs P2M vs Utility
            </span>
          </div>

          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.type_analysis || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="transaction_type" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#0F172A',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="avg_risk" name="Average Risk %" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="suspicious_count" name="Flagged Suspicious Count" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-100 flex justify-between">
            <span>P2P exhibits higher variance</span>
            <span>Bill Payments are low baseline risk</span>
          </div>
        </div>
      </div>

      {/* Grid: 2 Middle Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Merchant Category Risk (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Risk Exposure by Merchant Category</h2>
            <span className="text-[10px] font-mono text-slate-500">Retail Sectors</span>
          </div>

          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={data?.merchant_analysis || []}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis type="number" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis dataKey="merchant_category" type="category" stroke="#64748B" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#0F172A',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Bar dataKey="avg_risk" name="Avg Risk %" fill="#0284C7" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-100">
            <span>Evaluated against historical fraud distributions</span>
          </div>
        </div>

        {/* Amount Band Analysis (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">Amount Tier Sensitivity Analysis</h2>
            <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
              ₹ Exposure
            </span>
          </div>

          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data?.amount_analysis || []} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="tier" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderColor: '#E2E8F0',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#0F172A',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="count" name="Total Transfers" fill="#CBD5E1" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="avg_risk" name="Avg Risk %" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[11px] font-mono text-slate-500 pt-3 border-t border-slate-100">
            <span>Transactions exceeding ₹50,000 exhibit increased anomaly weights</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FraudAnalyticsPage;
