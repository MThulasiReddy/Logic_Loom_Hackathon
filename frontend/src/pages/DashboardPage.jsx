import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  Ban,
  Activity,
  Layers,
  IndianRupee,
  Clock,
  ArrowUpRight,
  SendHorizontal,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [sRes, aRes] = await Promise.all([
        apiClient.get('/api/dashboard/stats'),
        apiClient.get('/api/analytics/overview'),
      ]);
      setStats(sRes.data);
      setAnalytics(aRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-600">Loading Sentinel Security Analytics...</span>
        </div>
      </div>
    );
  }

  // Chart data formatting
  const riskPieData = stats?.risk_distribution
    ? Object.entries(stats.risk_distribution)
        .filter(([_, val]) => val > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  const PIE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
  const hourlyData = analytics?.hourly_patterns || [];
  const isZeroTransactions = stats?.total_transactions === 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              {isAdmin ? 'UPI Security Operations Center (SOC)' : 'My UPI Payments & Security Dashboard'}
            </h1>
            <span className="px-2.5 py-0.5 text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded-full font-semibold">
              {isAdmin ? 'SOC Global Feed' : 'Personal Activity'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isAdmin
              ? 'Real-time multi-dimensional UPI anomaly detection powered by Extra Trees Classifier'
              : `Viewing transactions and AI risk scores exclusively for ${user?.full_name || 'your account'}`}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium transition-colors shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            Refresh
          </button>
          
          <button
            onClick={() => navigate('/pay')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-sm"
          >
            <SendHorizontal className="w-4 h-4" />
            <span>Make a UPI Payment</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Analyzed */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase font-mono">My Transfers</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">{stats?.total_transactions || 0}</div>
          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-blue-600 font-semibold font-mono">100%</span> verified by ML
          </div>
        </div>

        {/* Approved */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-emerald-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase font-mono">Approved</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 font-mono">{stats?.approved_transactions || 0}</div>
          <div className="text-[10px] text-slate-500 mt-1">
            {stats?.total_transactions ? Math.round((stats.approved_transactions / stats.total_transactions) * 100) : 0}% settled instantly
          </div>
        </div>

        {/* OTP Challenges */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-amber-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase font-mono">Step-Up OTP</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">{stats?.otp_challenges || 0}</div>
          <div className="text-[10px] text-amber-700/80 mt-1">
            Provisional band ≥28.5%
          </div>
        </div>

        {/* Blocked */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-red-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase font-mono">Blocked</span>
            <Ban className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono">{stats?.blocked_transactions || 0}</div>
          <div className="text-[10px] text-red-700/80 mt-1">
            Threshold ≥57.1%
          </div>
        </div>

        {/* High Risk % */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-blue-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase font-mono">Risk Flag %</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600 font-mono">{stats?.high_risk_percentage || 0}%</div>
          <div className="text-[10px] text-slate-500 mt-1">
            Avg Risk: {stats?.avg_fraud_probability ? (stats.avg_fraud_probability * 100).toFixed(1) : 0}%
          </div>
        </div>

        {/* Total Volume */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:border-purple-400 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-medium uppercase font-mono">Total Spent</span>
            <IndianRupee className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-purple-700 font-mono truncate">
            ₹{stats?.total_volume_inr ? stats.total_volume_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Secured Settlements
          </div>
        </div>
      </div>

      {/* Clean Empty State if Newly Signed-Up User has 0 transactions */}
      {isZeroTransactions ? (
        <div className="bg-white rounded-2xl p-10 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600 shadow-sm">
            <Sparkles className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-slate-900">Your Account is Clean & Ready</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              You haven't made any UPI payments yet. When you initiate transfers, our trained Extra Trees machine learning model will assess risk in real-time and display your metrics right here.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => navigate('/pay')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20"
            >
              <SendHorizontal className="w-4 h-4" />
              <span>Make Your First UPI Payment</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Interactive Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Distribution Donut */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Risk Tier Distribution
                </h2>
                <span className="text-[10px] font-mono text-slate-500">Trained Cutoffs</span>
              </div>

              <div className="h-64 flex items-center justify-center">
                {riskPieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {riskPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="#FFFFFF" strokeWidth={2} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#FFFFFF',
                          borderColor: '#E2E8F0',
                          borderRadius: '8px',
                          fontSize: '12px',
                          color: '#0F172A',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-slate-400">No risk tiers recorded yet</div>
                )}
              </div>

              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between font-mono">
                <span>OTP Cutoff: 28.5%</span>
                <span>Block Cutoff: 57.1%</span>
              </div>
            </div>

            {/* 24-Hour Velocity Risk Chart */}
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    Hourly Transfer Activity & Risk Trend
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hourly activity distribution evaluated by cyclic time features
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                  hour_sin / hour_cos
                </span>
              </div>

              <div className="h-64 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="totalColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="flaggedColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="hour" stroke="#94A3B8" fontSize={10} tickLine={false} />
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
                    <Area type="monotone" dataKey="total_transactions" name="Total Volume" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#totalColor)" />
                    <Area type="monotone" dataKey="flagged_transactions" name="Flagged Risky" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#flaggedColor)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between font-mono">
                <span>Features: txn_hour, hour_sin, hour_cos</span>
                <span>Nocturnal hours (00:00 - 05:00) scored higher</span>
              </div>
            </div>
          </div>

          {/* Recent Suspicious Transactions Table */}
          {stats?.recent_suspicious && stats.recent_suspicious.length > 0 && (
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Flagged & Suspicious Activity
                  </h2>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Transactions exceeding the Step-Up OTP threshold (28.55%) or Block threshold (57.1%)
                  </p>
                </div>
                <button
                  onClick={() => navigate('/transactions')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
                >
                  View All Transfers
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px] bg-slate-50/50">
                      <th className="py-2.5 px-3">Reference</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Amount (INR)</th>
                      <th className="py-2.5 px-3">ML Fraud Prob</th>
                      <th className="py-2.5 px-3">Decision</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.recent_suspicious.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 px-3 font-mono font-semibold text-slate-800">
                          {tx.transaction_reference}
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                            {tx.transaction_type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-700">{tx.merchant_category}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">
                          ₹{tx.amount_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-3 font-mono">
                          <span className="text-amber-600 font-semibold">{tx.risk_percentage}%</span>
                          <span className="text-[10px] text-slate-400 ml-1">({tx.fraud_probability.toFixed(4)})</span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              tx.decision === 'BLOCK'
                                ? 'bg-red-100 text-red-700 border border-red-200'
                                : tx.decision === 'STEP_UP_OTP'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {tx.decision}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-mono text-slate-600">
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => navigate(`/transactions?search=${tx.transaction_reference}`)}
                            className="text-blue-600 hover:text-blue-700 text-[11px] font-medium hover:underline"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPage;
