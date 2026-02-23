import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Clock3, CircleCheckBig, TimerReset, ArrowRight } from 'lucide-react';
import taskService from '../api/task.service';
import type { ITask } from '../types/task.types';

const MentorDashboard = () => {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    taskService.getAllTasks()
      .then((data) => {
        setTasks(data);
        setError('');
      })
      .catch(() => setError('Failed to load mentor dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const pending = tasks.filter((t) => t.status === 'Pending').length;
    const inProgress = tasks.filter((t) => t.status === 'InProgress').length;
    const submitted = tasks.filter((t) => t.status === 'Submitted').length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;

    return {
      total: tasks.length,
      pending,
      inProgress,
      submitted,
      completed
    };
  }, [tasks]);

  const recentTasks = useMemo(
    () =>
      [...tasks]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    [tasks]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-56 bg-slate-200 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Mentor Dashboard</h1>
          <p className="text-slate-500 mt-1">Track task flow and keep interns moving.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/tasks/manage')}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-indigo-600 transition"
          >
            Open Task Console
          </button>
          <button
            onClick={() => navigate('/activities')}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            View Activity
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest mb-3">
            <ClipboardList size={14} /> Total
          </div>
          <p className="text-3xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold uppercase tracking-widest mb-3">
            <Clock3 size={14} /> Pending
          </div>
          <p className="text-3xl font-black text-amber-700">{stats.pending}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-widest mb-3">
            <TimerReset size={14} /> In Progress
          </div>
          <p className="text-3xl font-black text-indigo-700">{stats.inProgress}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-widest mb-3">
            <ClipboardList size={14} /> Submitted
          </div>
          <p className="text-3xl font-black text-blue-700">{stats.submitted}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-widest mb-3">
            <CircleCheckBig size={14} /> Completed
          </div>
          <p className="text-3xl font-black text-emerald-700">{stats.completed}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Recent Tasks</h2>
          <button
            onClick={() => navigate('/tasks/manage')}
            className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700"
          >
            All tasks <ArrowRight size={16} />
          </button>
        </div>

        {recentTasks.length === 0 ? (
          <div className="p-10 text-center text-slate-500">No tasks available yet.</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="w-full text-left px-6 py-4 hover:bg-slate-50 transition"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 truncate">{task.title}</p>
                    <p className="text-sm text-slate-500 truncate">{task.description}</p>
                  </div>
                  <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold ${
                    task.status === 'Completed'
                      ? 'bg-emerald-50 text-emerald-700'
                      : task.status === 'Submitted'
                        ? 'bg-blue-50 text-blue-700'
                      : task.status === 'InProgress'
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'bg-amber-50 text-amber-700'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MentorDashboard;
