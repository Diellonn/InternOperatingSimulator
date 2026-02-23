import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import taskService from '../api/task.service';
import type { ITask } from '../types/task.types';
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Calendar, 
  ArrowRight,
  Inbox
} from 'lucide-react';

const InternTasks = () => {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Pending' | 'Submitted' | 'Completed'>('All');
  const navigate = useNavigate();

  useEffect(() => {
    taskService.getMyTasks()
      .then(data => setTasks(data))
      .catch(err => {
        console.error("Error fetching tasks", err);
        setError("Failed to load your tasks");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmitTask = async (taskId: number) => {
    try {
      await taskService.submitTask(taskId);
      setTasks(tasks.map(t => 
        t.id === taskId 
          ? { ...t, status: 'Submitted' }
          : t
      ));
    } catch (err) {
      setError("Failed to submit task for review");
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (activeTab === 'All') return true;
    return t.status === activeTab || (activeTab === 'Pending' && (t.status === 'InProgress' || t.status === 'Pending'));
  });

  if (loading) return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-32 w-full bg-slate-100 animate-pulse rounded-2xl" />
      ))}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Tasks</h1>
          <p className="text-slate-500 font-medium mt-1">
            You have <span className="text-indigo-600 font-bold">{tasks.filter(t => t.status !== 'Completed').length} active tasks</span> to focus on today.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
          {['All', 'Pending', 'Submitted', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-700 text-sm font-medium">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-16 text-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Inbox size={40} className="text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">Clear skies!</h3>
          <p className="text-slate-500 mt-2">No {activeTab.toLowerCase()} tasks found in your queue.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map(task => {
            const isCompleted = task.status === 'Completed';
            const isInProgress = task.status === 'InProgress';
            const isSubmitted = task.status === 'Submitted';

            return (
              <div
                key={task.id}
                onClick={() => navigate(`/tasks/${task.id}`)}
                className="group relative bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-200 transition-all duration-300 cursor-pointer flex items-center gap-6 overflow-hidden"
              >
                {/* Status Accent Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  isCompleted ? 'bg-emerald-500' : isInProgress ? 'bg-indigo-500' : 'bg-amber-400'
                }`} />

                {/* Left: Status Toggle */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isCompleted && !isSubmitted) handleSubmitTask(task.id);
                  }}
                  className={`shrink-0 w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                    isCompleted 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : isSubmitted
                        ? 'bg-blue-50 text-blue-600'
                      : 'bg-slate-50 text-slate-300 hover:bg-indigo-50 hover:text-indigo-500 hover:scale-110'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                </button>

                {/* Center: Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-bold text-lg truncate ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                      {task.title}
                    </h3>
                  </div>
                  <p className="text-slate-500 text-sm line-clamp-1 mb-3 group-hover:text-slate-600 transition-colors">
                    {task.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-tight">
                      <Calendar size={14} />
                      {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                      isSubmitted ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      isInProgress ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      'bg-amber-50 text-amber-700 border-amber-100'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>

                {/* Right: Action/Arrow */}
                <div className="hidden sm:flex items-center gap-4">
                  {!isCompleted && !isSubmitted && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSubmitTask(task.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-indigo-600"
                    >
                      Submit Review
                    </button>
                  )}
                  <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default InternTasks;
