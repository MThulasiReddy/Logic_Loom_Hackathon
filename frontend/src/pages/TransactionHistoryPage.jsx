import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Ban,
  Eye,
  X,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatIST } from '../utils/date';

const TransactionHistoryPage = () => {
  const { user, isAdmin } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState('');
  const [decision, setDecision] = useState('ALL');
  const [transactionType, setTransactionType] = useState('ALL');
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');
  const [loading, setLoading] = useState(true);

  // Selected for detail modal
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        search: search.trim() || undefined,
        decision: decision !== 'ALL' ? decision : undefined,
        transaction_type: transactionType !== 'ALL' ? transactionType : undefined,
        sort_by: sortBy,
        order
      };
      const res = await apiClient.get('/api/transactions', { params });
      setTransactions(res.data.transactions || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.total_pages || 1);
    } catch (err) {
      console.error('Failed to load transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, limit, decision, transactionType, sortBy, order, user]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTransactions();
  };

  const exportCSV = () => {
    if (transactions.length === 0) return;
    const headers = ['Reference', 'Type', 'Category', 'Amount (INR)', 'ML Fraud Prob', 'Risk %', 'Decision', 'Status', 'Date'];
    const rows = transactions.map(t => [
      t.transaction_reference,
      t.transaction_type,
      t.merchant_category,
      t.amount_inr,
      t.fraud_probability,
      t.risk_percentage,
      t.decision,
      t.status,
      formatIST(t.created_at)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `upi_sentinel_transactions_p${page}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            {isAdmin ? 'Global Transaction Audit Ledger' : 'My UPI Transaction Ledger'}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isAdmin
              ? 'Complete system-wide log of all evaluated digital payment transactions and model inferences'
              : 'Secure record of your personal UPI payments and real-time AI security evaluations'}
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-xs text-slate-700 font-medium transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-blue-600" />
          Export Ledger (CSV)
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference ID, category, bank, or state..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono shadow-sm"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Decision Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-mono text-[11px] font-medium">Decision:</span>
            <select
              value={decision}
              onChange={(e) => { setDecision(e.target.value); setPage(1); }}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Decisions</option>
              <option value="APPROVE">APPROVE (Low Risk)</option>
              <option value="STEP_UP_OTP">STEP_UP_OTP (Medium)</option>
              <option value="BLOCK">BLOCK (High Risk)</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-mono text-[11px] font-medium">Type:</span>
            <select
              value={transactionType}
              onChange={(e) => { setTransactionType(e.target.value); setPage(1); }}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="P2P">P2P</option>
              <option value="P2M">P2M</option>
              <option value="Bill Payment">Bill Payment</option>
              <option value="Recharge">Recharge</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-mono text-[11px] font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none"
            >
              <option value="created_at">Timestamp</option>
              <option value="amount_inr">Amount (INR)</option>
              <option value="risk_percentage">Risk %</option>
            </select>
            <button
              onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
              className="p-1 rounded bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="ml-auto text-[11px] font-mono text-slate-500">
            Total records: <span className="text-slate-900 font-bold">{total}</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono uppercase text-[10px]">
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Bank Route</th>
                <th className="py-3 px-4">Amount (INR)</th>
                <th className="py-3 px-4">ML Probability</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500 font-mono">
                    Loading ledger records...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No transactions recorded yet for your account.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {tx.transaction_reference}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{tx.merchant_category}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {tx.sender_bank || 'SBI'} → {tx.receiver_bank || 'HDFC'}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      ₹{tx.amount_inr.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={tx.risk_percentage >= 28.5 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-semibold'}>
                        {tx.risk_percentage}%
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">({tx.fraud_probability.toFixed(4)})</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
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
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono text-slate-600">
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {formatIST(tx.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-blue-600 hover:text-blue-700 transition-colors shadow-sm"
                        title="View Detailed ML Attributes"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-500 font-mono">
            Showing Page <span className="text-slate-900 font-bold">{page}</span> of{' '}
            <span className="text-slate-900 font-bold">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium shadow-sm"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Previous
            </button>

            <button
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium shadow-sm"
            >
              Next
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Inspection Modal Drawer */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono text-blue-600 uppercase font-bold">Transaction Audit Deep Dive</span>
                <h3 className="text-base font-bold font-mono text-slate-900">{selectedTx.transaction_reference}</h3>
              </div>
              <button onClick={() => setSelectedTx(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Verdict summary */}
            <div className={`p-4 rounded-xl border flex items-center justify-between ${
              selectedTx.decision === 'APPROVE'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : selectedTx.decision === 'STEP_UP_OTP'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <div className="flex items-center gap-3">
                {selectedTx.decision === 'APPROVE' ? (
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                ) : selectedTx.decision === 'STEP_UP_OTP' ? (
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                ) : (
                  <Ban className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <span className="text-[10px] uppercase font-mono block opacity-75 font-semibold">Decision Verdict</span>
                  <span className="text-lg font-bold font-mono">{selectedTx.decision}</span>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] block opacity-75 font-semibold">Fraud Probability</span>
                <span className="text-base font-bold">{selectedTx.fraud_probability.toFixed(6)} ({selectedTx.risk_percentage}%)</span>
              </div>
            </div>

            {/* Full ML Input Matrix */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-900 block">Engineered Features Input Vector:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono">
                <div>
                  <span className="text-slate-500 text-[10px] block">Amount (INR)</span>
                  <span className="text-slate-900 font-bold">₹{selectedTx.amount_inr}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Transaction Type</span>
                  <span className="text-slate-700">{selectedTx.transaction_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Merchant Category</span>
                  <span className="text-slate-700">{selectedTx.merchant_category}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Sender Bank</span>
                  <span className="text-slate-700">{selectedTx.sender_bank || 'SBI'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Receiver Bank</span>
                  <span className="text-slate-700">{selectedTx.receiver_bank || 'HDFC'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Sender State</span>
                  <span className="text-slate-700">{selectedTx.sender_state || 'Maharashtra'}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Age Demographics</span>
                  <span className="text-slate-700">{selectedTx.sender_age_group} → {selectedTx.receiver_age_group}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Device Platform</span>
                  <span className="text-slate-700">{selectedTx.device_type}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block">Network Bearer</span>
                  <span className="text-slate-700">{selectedTx.network_type}</span>
                </div>
              </div>
            </div>

            {/* Rationale */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-mono uppercase text-blue-700 block font-bold">
                Extra Trees Anomaly Explanation
              </span>
              <p className="text-xs text-slate-700 leading-relaxed">
                {selectedTx.explanation || 'Normal transaction velocity and demographics verified.'}
              </p>
            </div>

            {selectedTx.admin_notes && (
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                <span className="text-[10px] font-mono uppercase text-blue-800 block font-bold">
                  Administrative Review Log
                </span>
                <p className="text-xs text-slate-700">{selectedTx.admin_notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryPage;
