import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, FileText, ShieldAlert, BarChart3,
  Bell, LogOut, Menu, X, ClipboardList, UserCircle,
  ChevronRight, Building2, Briefcase
} from 'lucide-react';

const navConfig = {
  admin: [
    { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/policies', label: 'Policies', icon: FileText },
    { path: '/claims', label: 'Claims', icon: ClipboardList },
    { path: '/claims-workflow', label: 'Claims Workflow', icon: Briefcase },
    { path: '/fraud-report', label: 'Fraud Detection', icon: ShieldAlert },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ],
  agent: [
    { path: '/agent', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/customers', label: 'Customers', icon: Users },
    { path: '/policies', label: 'Policies', icon: FileText },
    { path: '/claims', label: 'Submit Claim', icon: ClipboardList },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ],
  customer: [
    { path: '/customer', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/claims', label: 'My Claims', icon: ClipboardList },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ],
  claims_manager: [
    { path: '/claims-workflow', label: 'Claims Workflow', icon: Briefcase },
    { path: '/claims', label: 'All Claims', icon: ClipboardList },
    { path: '/fraud-report', label: 'Fraud Detection', icon: ShieldAlert },
    { path: '/analytics', label: 'Analytics', icon: BarChart3 },
    { path: '/notifications', label: 'Notifications', icon: Bell },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = navConfig[user?.role] || [];

  const roleLabel = {
    admin: 'Administrator',
    agent: 'Insurance Agent',
    customer: 'Policyholder',
    claims_manager: 'Claims Manager',
  };

  const roleIcon = {
    admin: Building2,
    agent: Briefcase,
    customer: UserCircle,
    claims_manager: ShieldAlert,
  };

  const RoleIcon = roleIcon[user?.role] || UserCircle;

  return (
    <>
      {/* Mobile toggle */}
      <button
        id="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="sidebar"
        className={`
          fixed top-0 left-0 h-screen z-40 flex flex-col
          bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950
          border-r border-slate-700/50
          transition-all duration-300 ease-in-out
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo area */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/25">
            <ShieldAlert size={22} className="text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-lg font-bold text-white tracking-tight">InsuranceIQ</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-widest uppercase">Intelligence Platform</p>
            </div>
          )}
          <button
            id="sidebar-collapse-toggle"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex ml-auto p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <ChevronRight size={16} className={`transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>

        {/* User info */}
        <div className={`px-4 py-4 border-b border-slate-700/50 ${collapsed ? 'px-3' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/30 flex items-center justify-center flex-shrink-0">
              <RoleIcon size={18} className="text-violet-400" />
            </div>
            {!collapsed && (
              <div className="animate-fade-in overflow-hidden">
                <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{roleLabel[user?.role]}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group relative
                  ${isActive
                    ? 'bg-blue-500/15 text-blue-400 shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }
                `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-blue-500 rounded-r-full" />
                )}
                <Icon size={20} className={`flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {!collapsed && <span className="animate-fade-in">{item.label}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 text-xs font-medium opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all shadow-xl border border-slate-700 whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-slate-700/50">
          <Link
            to="/login"
            id="nav-logout"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </Link>
        </div>
      </aside>
    </>
  );
}
