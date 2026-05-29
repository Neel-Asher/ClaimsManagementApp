import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TopNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState([]);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notifIcon = {
    claimFiled: '📋',
    claimStatusUpdated: '🔄',
    fraudScoreGenerated: '🚨',
    policyRenewalDue: '🔔',
  };

  return (
    <header
      id="top-navbar"
      className="sticky top-0 z-30 h-16 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-xl flex items-center justify-between px-6 gap-4"
    >
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            id="global-search"
            type="text"
            placeholder="Search policies, claims, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications bell */}
        <div ref={notifRef} className="relative">
          <button
            id="notifications-bell"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-200">Notifications</h3>
                <span className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">Mark all read</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 5).map((notif) => (
                  <div
                    key={notif.id}
                    className={`px-4 py-3 border-b border-slate-700/50 hover:bg-slate-750 transition-colors cursor-pointer ${!notif.read ? 'bg-blue-500/5' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{notifIcon[notif.type] || '📌'}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs ${!notif.read ? 'text-slate-200 font-medium' : 'text-slate-400'}`}>
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1">{notif.time}</p>
                      </div>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setShowNotifications(false); navigate('/notifications'); }}
                className="w-full px-4 py-2.5 text-xs text-blue-400 hover:bg-slate-750 transition-colors font-medium"
              >
                View All Notifications →
              </button>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            id="profile-dropdown"
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <span className="text-sm text-slate-300 hidden sm:block">{user?.name}</span>
            <ChevronDown size={14} className="text-slate-500" />
          </button>

          {showProfile && (
            <div className="absolute right-0 top-12 w-56 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-sm font-semibold text-slate-200">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full px-4 py-3 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
