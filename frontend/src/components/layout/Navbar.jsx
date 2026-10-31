import React, { useState, useEffect } from 'react';
import { Bell, Activity, ShieldCheck, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import apiClient from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { formatISTTime } from '../../utils/date';

const Navbar = () => {
  const { user, login } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDrawer, setShowDrawer] = useState(false);
  const [health, setHealth] = useState({ status: 'healthy', ml_model: { name: 'Extra Trees' } });

  const fetchHealthAndNotifs = async () => {
    try {
      const hRes = await apiClient.get('/api/health');
      setHealth(hRes.data);
    } catch (e) {
      // offline/fallback
    }

    if (user?.role === 'admin') {
      try {
        const nRes = await apiClient.get('/api/admin/notifications?limit=10');
        setNotifications(nRes.data.items || []);
        setUnreadCount(nRes.data.unread_count || 0);
      } catch (e) {
        // ignore
      }
    }
  };

  useEffect(() => {
    fetchHealthAndNotifs();
    const interval = setInterval(fetchHealthAndNotifs, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const markAllRead = async () => {
    try {
      await apiClient.post('/api/admin/notifications/mark-all-read');
      setUnreadCount(0);
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // 1-click Demo switch helper
  const handleQuickSwitch = async (role) => {
    if (role === 'admin') {
      await login('admin@upisentinel.com', 'Admin@2024');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20 shadow-sm">
      {/* Left: Model Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-500 font-mono text-[11px]">ML Pipeline:</span>
          <span className="font-semibold text-emerald-700 font-mono text-[11px]">
            {health.ml_model?.name || 'Extra Trees'}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>Real-Time UPI Fraud Sentinel Active</span>
        </div>
      </div>

      {/* Right: Quick Switch & Notifications */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <span className="text-[10px] text-slate-500 uppercase font-mono px-1.5 font-medium">Demo Role:</span>
          <button
            onClick={() => handleQuickSwitch('payer')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              user?.role === 'user'
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Payer
          </button>
          <button
            onClick={() => handleQuickSwitch('admin')}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
              user?.role === 'admin'
                ? 'bg-amber-500 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            SOC Admin
          </button>
        </div>

        {/* Admin Notification Drawer */}
        {user?.role === 'admin' && (
          <div className="relative">
            <button
              onClick={() => setShowDrawer(!showDrawer)}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 relative transition-colors shadow-sm"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Drawer Popover */}
            {showDrawer && (
              <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-slate-200 rounded-xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-xs text-slate-900">Fraud Security Alerts</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.2 rounded font-mono font-medium">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] text-blue-600 hover:underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                    <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto mt-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-500">
                      No security alerts registered.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`py-2 px-2 text-xs transition-colors rounded ${
                          !n.is_read ? 'bg-blue-50/60' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900 text-[11px]">{n.title}</span>
                          <span className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded font-semibold ${
                            n.severity === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {n.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1">{n.message}</p>
                        <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                          {formatISTTime(n.created_at)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
