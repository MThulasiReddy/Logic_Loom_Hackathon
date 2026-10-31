import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Layers,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Info,
  CheckCircle2,
  Lock,
  GitBranch,
  Settings2
} from 'lucide-react';
import apiClient from '../api/client';

const ModelInfoPage = () => {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await apiClient.get('/api/model/info');
        setModelInfo(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInfo();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-600">Loading Extra Trees Architecture Metadata...</span>
        </div>
      </div>
    );
  }

  const metrics = modelInfo?.evaluation_metrics || {};

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" />
              Machine Learning Model Specifications
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-semibold">
              Production Verified
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Architecture parameters, threshold methodology, evaluation metrics, and feature transformations
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-700 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
          <Settings2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Active Pipeline: {modelInfo?.model_name || 'Extra Trees (class_weight)'}</span>
        </div>
      </div>

      {/* Model Overview & Evaluation Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Validation PR-AUC */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-mono uppercase font-medium">Validation PR-AUC</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700 font-mono">
            {metrics.validation_pr_auc ? metrics.validation_pr_auc.toFixed(6) : '0.001985'}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Precision-Recall Curve Area</span>
        </div>

        {/* Test PR-AUC */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-mono uppercase font-medium">Test PR-AUC</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-700 font-mono">
            {metrics.test_pr_auc ? metrics.test_pr_auc.toFixed(6) : '0.001796'}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Holdout Generalization</span>
        </div>

        {/* Block Threshold */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-mono uppercase font-medium">Block Threshold</span>
            <Lock className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600 font-mono">
            {(modelInfo?.block_threshold * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block font-mono">Raw: {modelInfo?.block_threshold?.toFixed(4)}</span>
        </div>

        {/* OTP Provisional Threshold */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[10px] font-mono uppercase font-medium">Provisional OTP Band</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600 font-mono">
            {(modelInfo?.otp_threshold_provisional * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block font-mono">Raw: {modelInfo?.otp_threshold_provisional?.toFixed(4)}</span>
        </div>
      </div>

      {/* Threshold Methodology & Note Box */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          Threshold Optimization Methodology & Operational Note
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono text-blue-700 uppercase font-bold block">
              Minimum Expected Cost Method:
            </span>
            <p className="leading-relaxed">
              {modelInfo?.threshold_method || 'Minimum validation expected cost for binary missed-fraud vs false-block costs.'}
            </p>
            <div className="pt-2 text-[11px] font-mono text-slate-600 space-y-0.5">
              <div>Missed Fraud Illustrative Cost: <span className="text-slate-900 font-bold">₹5,000.00</span></div>
              <div>False Block Illustrative Cost: <span className="text-slate-900 font-bold">₹100.00</span></div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-mono text-amber-700 uppercase font-bold block">
              Provisional Settings & Leakage Mitigation:
            </span>
            <p className="leading-relaxed">
              {modelInfo?.note || 'transaction_status excluded as potential leakage; OTP band is provisional and not cost-optimized.'}
            </p>
            <div className="pt-2 text-[11px] font-mono text-slate-600">
              Random State: <span className="text-slate-900 font-bold">42</span> • Estimators: <span className="text-slate-900 font-bold">180</span> • Max Depth: <span className="text-slate-900 font-bold">16</span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Engineering & Ordering Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* All Input Features in exact order */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Full Feature Input Vector</h2>
              <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                16 Features
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              Exact column order passed directly into the Pipeline's ColumnTransformer:
            </p>
            <div className="space-y-1.5 max-h-80 overflow-y-auto font-mono text-xs pr-1">
              {modelInfo?.input_features?.map((feat, idx) => (
                <div key={feat} className="flex items-center justify-between p-2 rounded bg-slate-50 border border-slate-200 text-slate-700">
                  <span className="font-medium text-slate-800">{feat}</span>
                  <span className="text-[10px] text-blue-700 font-bold">Index {idx}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categorical vs Numeric Pipeline Breakdown */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Pipeline Preprocessing</h2>
              <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                ColumnTransformer
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-blue-700 font-bold block mb-1">
                  Numeric Pipeline (SimpleImputer[median] → StandardScaler):
                </span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  {modelInfo?.numeric_features?.map((num) => (
                    <span key={num} className="px-2 py-1 rounded bg-blue-50 border border-blue-200 text-blue-800">
                      {num}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-teal-700 font-bold block mb-1">
                  Categorical Pipeline (SimpleImputer[most_frequent] → OneHotEncoder[ignore]):
                </span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  {modelInfo?.categorical_features?.map((cat) => (
                    <span key={cat} className="px-2 py-1 rounded bg-teal-50 border border-teal-200 text-teal-800">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 pt-3 border-t border-slate-100">
            Handles unknown categories at inference with ignore policy
          </div>
        </div>

        {/* Excluded Columns (Data Leakage Prevention) */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900">Excluded Columns</h2>
              <span className="text-[10px] font-mono text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-semibold">
                Data Leakage Guard
              </span>
            </div>

            <p className="text-[11px] text-slate-500 mb-3">
              These columns were strictly excluded from model training to prevent target leakage and artificial overfitting:
            </p>

            <div className="space-y-1.5 font-mono text-xs">
              {modelInfo?.excluded_columns?.map((col) => (
                <div key={col} className="flex items-center justify-between p-2 rounded bg-red-50 border border-red-200 text-red-800">
                  <span>{col}</span>
                  <span className="text-[10px] uppercase font-bold text-red-700">Blocked</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] font-mono text-slate-500 pt-3 border-t border-slate-100">
            Prevents data leakage from status flags and IDs
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelInfoPage;
