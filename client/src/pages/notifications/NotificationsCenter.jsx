import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2, Filter } from 'lucide-react';
import { socketService } from '../../services/socketService';

const typeConfig = {
  claimFiled: { icon: '📋', label: 'Claim Filed', color: 'border-l-blue-500' },
  claimStatusUpdated: { icon: '🔄', label: 'Status Updated', color: 'border-l-emerald-500' },
  fraudScoreGenerated: { icon: '🚨', label: 'Fraud Alert', color: 'border-l-red-500' },
  policyRenewalDue: { icon: '🔔', label: 'Renewal Due', color: 'border-l-amber-500' },
};

export default function NotificationsCenter() {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Attempt socket connection for real-time notifications
    try {
      socketService.connect('current-user');

      socketService.on('claimFiled', (data) => {
        setNotifications(prev => [{ id: Date.now(), type: 'claimFiled', message: data.message, time: 'Just now', read: false }, ...prev]);
      });
      socketService.on('claimStatusUpdated', (data) => {
        setNotifications(prev => [{ id: Date.now(), type: 'claimStatusUpdated', message: data.message, time: 'Just now', read: false }, ...prev]);
      });
      socketService.on('fraudScoreGenerated', (data) => {
        setNotifications(prev => [{ id: Date.now(), type: 'fraudScoreGenerated', message: data.message, time: 'Just now', read: false }, ...prev]);
      });
      socketService.on('policyRenewalDue', (data) => {
        setNotifications(prev => [{ id: Date.now(), type: 'policyRenewalDue', message: data.message, time: 'Just now', read: false }, ...prev]);
      });
    } catch {
      // Socket unavailable — using mock data
    }

    return () => socketService.disconnect();
  }, []);

  const filteredNotifs = filter === 'all'
    ? notifications
    : filter === 'unread'
    ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotif = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filters = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: `Unread (${unreadCount})` },
    { key: 'claimFiled', label: 'Claims' },
    { key: 'fraudScoreGenerated', label: 'Fraud' },
    { key: 'policyRenewalDue', label: 'Renewals' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications Center</h1>
          <p className="text-sm text-slate-400 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-xl hover:bg-blue-500/30 transition-colors"
          >
            <CheckCheck size={16} /> Mark All Read
          </button>
        )}
      </div>

      {/* Socket status indicator */}
      <div className="glass-card p-3 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-xs text-slate-400">Real-time notifications via Socket.IO — <span className="text-amber-400">Mock mode (server not connected)</span></span>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={16} className="text-slate-500" />
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              filter === f.key
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {filteredNotifs.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Bell size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No notifications to show</p>
          </div>
        ) : (
          filteredNotifs.map((notif) => {
            const config = typeConfig[notif.type] || { icon: '📌', label: 'Notification', color: 'border-l-slate-500' };
            return (
              <div
                key={notif.id}
                onClick={() => markRead(notif.id)}
                className={`glass-card p-4 border-l-4 ${config.color} cursor-pointer transition-all hover:border-opacity-100 ${
                  !notif.read ? 'bg-blue-500/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{config.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{config.label}</span>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    <p className={`text-sm ${!notif.read ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                      {notif.message}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">{notif.time}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteNotif(notif.id); }}
                    className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
