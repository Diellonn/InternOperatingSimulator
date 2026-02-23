import { useEffect, useState } from 'react';
import dashboardService from '../api/dashboard.service';
import type { IDashboardStats } from '../types/dashboard.types';
import { 
  Users, 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  MessageSquare, 
  TrendingUp,
  ArrowRight,
  Activity,
  Zap
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getStats()
      .then(data => setStats(data))
      .catch(err => console.error("Error fetching stats", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-8 animate-pulse">
      <div className="h-10 w-48 bg-slate-200 rounded-lg"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-40 bg-slate-100 rounded-[2rem]"></div>
        ))}
      </div>
    </div>
  );

  const statCards = [
    { title: 'Fleet Capacity', label: 'Total Tasks', value: stats?.totalTasks, icon: <ClipboardList size={20} />, theme: 'indigo' },
    { title: 'Pending Review', label: 'Queue', value: stats?.pendingTasks, icon: <Clock size={20} />, theme: 'amber' },
    { title: 'Active Heat', label: 'In Progress', value: stats?.inProgressTasks, icon: <TrendingUp size={20} />, theme: 'blue' },
    { title: 'Yield Rate', label: 'Completed', value: stats?.completedTasks, icon: <CheckCircle size={20} />, theme: 'emerald' },
    { title: 'Talent Pool', label: 'Interns', value: stats?.totalInterns, icon: <Users size={20} />, theme: 'violet' },
    { title: 'System Pulse', label: 'Daily Comments', value: stats?.commentsToday, icon: <MessageSquare size={20} />, theme: 'rose' },
  ];

  const getThemeClasses = (theme: string) => {
    const themes: Record<string, string> = {
      indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100 shadow-indigo-100/50',
      amber: 'text-amber-600 bg-amber-50 border-amber-100 shadow-amber-100/50',
      blue: 'text-blue-600 bg-blue-50 border-blue-100 shadow-blue-100/50',
      emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100 shadow-emerald-100/50',
      violet: 'text-violet-600 bg-violet-50 border-violet-100 shadow-violet-100/50',
      rose: 'text-rose-600 bg-rose-50 border-rose-100 shadow-rose-100/50',
    };
    return themes[theme] || themes.indigo;
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Pulse</h1>
          <p className="text-slate-500 font-medium mt-1">Real-time performance metrics for InternOS</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
          <Zap size={16} fill="currentColor" />
          <span className="text-xs font-black uppercase tracking-widest">Live Updates</span>
        </div>
      </div>

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <div 
            key={index} 
            className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 overflow-hidden"
          >
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:scale-150 transition-transform duration-700">
              {card.icon}
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-2xl border ${getThemeClasses(card.theme)} transition-transform group-hover:rotate-6`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{card.title}</p>
                  <p className="text-xs font-bold text-slate-600">{card.label}</p>
                </div>
              </div>
              
              <div className="flex items-baseline gap-2">
                <h3 className="text-5xl font-black text-slate-900 tracking-tighter">{card.value}</h3>
                <div className="flex items-center text-emerald-500 font-bold text-xs">
                  <Activity size={12} className="mr-1" />
                  <span>Stable</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Activity Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Table Area */}
        <div className="xl:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Logs</h2>
              <p className="text-sm text-slate-500 font-medium">Monitoring latest intern interactions</p>
            </div>
            <button className="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
              Full Archive
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Operator</th>
                  <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Description</th>
                  <th className="py-5 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats?.recentActivity?.slice(0, 6).map((log, index) => (
                  <tr key={index} className="group hover:bg-indigo-50/30 transition-all duration-300">
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-slate-200 group-hover:bg-indigo-600 transition-colors">
                          {log.userName.charAt(0)}
                        </div>
                        <span className="text-sm font-bold text-slate-700">{log.userName}</span>
                      </div>
                    </td>
                    <td className="py-5 px-8">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600 font-medium">{log.action}</span>
                        <div className="h-1 w-1 bg-slate-300 rounded-full" />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase">Verified</span>
                      </div>
                    </td>
                    <td className="py-5 px-8 text-right">
                      <span className="text-xs font-bold text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Info Card */}
        <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden flex flex-col justify-between shadow-2xl shadow-indigo-200">
           <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
           
           <div>
              <h3 className="text-2xl font-black leading-tight mb-4">Platform <br/>Health Score</h3>
              <div className="text-6xl font-black mb-2">98<span className="text-indigo-400 text-3xl">%</span></div>
              <p className="text-indigo-200 text-sm font-medium">All systems operational. Network latency is optimal at 42ms.</p>
           </div>

           <div className="mt-8 space-y-4 relative z-10">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                 <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-1">Active Mentors</p>
                 <p className="text-xl font-black">12 Available</p>
              </div>
              <button className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
                 Generate Report <ArrowRight size={14} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;