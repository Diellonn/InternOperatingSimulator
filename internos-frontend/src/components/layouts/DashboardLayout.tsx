import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Users,
  History,
  ChevronRight,
  Bell,
  Search,
  Menu,
  Clock3,
  MessageCircle
} from 'lucide-react';
import authService from '../../api/auth.service';
import UserAccountDropdown from '../UserAccountDropdown';
import activityService, { type ActivityLog } from '../../api/activity.service';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const user = authService.getCurrentUser();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<ActivityLog[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await activityService.getActivityLogs();
        setNotifications(data.slice(0, 8));
      } catch {
        setNotifications([]);
      }
    };

    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const readKey = `notifications_read_at_${user?.id ?? 'guest'}`;

  const unreadCount = useMemo(() => {
    const readAtRaw = localStorage.getItem(readKey);
    const readAt = readAtRaw ? new Date(readAtRaw).getTime() : 0;

    return notifications.filter((n) => new Date(n.timestamp).getTime() > readAt).length;
  }, [notifications, readKey]);

  const markNotificationsAsRead = () => {
    localStorage.setItem(readKey, new Date().toISOString());
  };

  const menuItems = [
    {
      label: 'Overview',
      icon: <LayoutDashboard size={18} />,
      path: user?.role === 'Admin' ? '/admin/dashboard' : user?.role === 'Mentor' ? '/mentor/dashboard' : '/intern/dashboard'
    },
    ...(user?.role !== 'Intern' ? [{ label: 'Task Console', icon: <CheckSquare size={18} />, path: '/tasks/manage' }] : []),
    ...(user?.role === 'Intern' ? [{ label: 'My Assignments', icon: <CheckSquare size={18} />, path: '/intern/tasks' }] : []),
    ...(user?.role === 'Admin' ? [{ label: 'User Directory', icon: <Users size={18} />, path: '/admin/users' }] : []),
    { label: 'Messages', icon: <MessageCircle size={18} />, path: '/messages' },
    { label: 'Activity Log', icon: <History size={18} />, path: '/activities' },
  ];

  const activeItem = menuItems.find(i => i.path === location.pathname);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans text-slate-900">
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[40] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[50]
        w-72 bg-slate-900 text-white flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <CheckSquare className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none">
                Intern<span className="text-indigo-400">OS</span>
              </h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Platform</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          <p className="px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Main Menu</p>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center justify-between group px-4 py-3 rounded-2xl transition-all duration-300
                  ${isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-xl shadow-indigo-600/20'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-white' : 'group-hover:text-indigo-400'} transition-colors`}>
                    {item.icon}
                  </span>
                  <span className="font-bold text-sm tracking-tight">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={14} className="animate-pulse" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 pb-3 text-[10px] text-slate-500 font-semibold tracking-wide">
          Powered by <span className="text-slate-300">Diellon Haxhaj</span>
        </div>

        <UserAccountDropdown />
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-20 flex items-center justify-between px-8 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>

            <div className="hidden sm:block">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-0.5">
                <span>Workspace</span>
                <ChevronRight size={10} />
                <span className="text-indigo-500">{user?.role}</span>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {activeItem?.label || 'Overview'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200 group focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500" />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-transparent border-none outline-none text-sm font-medium w-48 text-slate-700 placeholder:text-slate-400"
              />
            </div>

            <div className="relative" ref={notifRef}>
              <button
                onClick={() => {
                  const next = !isNotifOpen;
                  setIsNotifOpen(next);
                  if (next) markNotificationsAsRead();
                }}
                className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-xl transition-all"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-5 h-5 px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-96 max-w-[92vw] bg-white border border-slate-200 rounded-2xl shadow-2xl z-[70] overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-sm font-black text-slate-900">Notifications</h3>
                    <Link to="/activities" className="text-xs font-bold text-indigo-600 hover:text-indigo-700">
                      View all
                    </Link>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-sm text-slate-500 text-center">No notifications yet.</div>
                    ) : (
                      notifications.map((item) => (
                        <div key={item.id} className="px-4 py-3 border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition">
                          <p className="text-sm font-semibold text-slate-700">{item.action}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {item.userName} {item.taskTitle && item.taskTitle !== 'N/A' ? `• ${item.taskTitle}` : ''}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1 inline-flex items-center gap-1">
                            <Clock3 size={12} /> {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
