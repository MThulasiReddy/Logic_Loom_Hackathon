import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  SendHorizontal,
  Flame,
  UserCheck,
  History,
  BarChart3,
  Cpu,
  LogOut,
  Wallet,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth();

  const allNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'UPI Pay & Transfer', path: '/pay', icon: SendHorizontal, badge: 'Payer' },
    { name: 'Transaction History', path: '/transactions', icon: History },
    { name: 'Live Fraud Sandbox', path: '/sandbox', icon: Flame },
    { name: 'Fraud Analytics', path: '/analytics', icon: BarChart3, adminOnly: true },
    { name: 'Admin Risk Review', path: '/admin/review', icon: UserCheck, badge: 'Admin', adminOnly: true },
    { name: 'Model Specifications', path: '/model-info', icon: Cpu },
  ];

  // Filter items: Only show admin items if user is actually admin
  const navItems = allNavItems.filter((item) => !item.adminOnly || isAdmin);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 select-none shadow-sm">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-200 bg-white">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-slate-900 flex items-center gap-1.5">
              UPI Sentinel
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
                ML-02
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono">Extra Trees Engine</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-medium ${
                    item.adminOnly 
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* User Info & Footer */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        {user ? (
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-800 font-semibold truncate max-w-[130px]">
                  {user.full_name}
                </span>
                <span
                  className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-700 border border-purple-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1.5 pt-1.5 border-t border-slate-100">
                <Wallet className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-mono text-slate-900 font-bold">
                  ₹{Number(user.wallet_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 font-medium"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        ) : (
          <NavLink
            to="/login"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all shadow-sm"
          >
            Sign In / Register
            <ChevronRight className="w-4 h-4" />
          </NavLink>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
