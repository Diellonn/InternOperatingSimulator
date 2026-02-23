import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Eye, Trash2, Calendar, MessageSquare, 
  CheckCircle2, Clock, AlertCircle, User as UserIcon, X,
  Trash, AlertTriangle
} from 'lucide-react';
import taskService from '../api/task.service';
import userService from '../api/user.service';
import type { ITask } from '../types/task.types';
import type { User } from '../api/user.service';

const TaskManagement = () => {
  const [tasks, setTasks] = useState<ITask[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // States for Modals
  const [showForm, setShowForm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<{id: number, title: string} | null>(null);
  
  const [formData, setFormData] = useState({ title: '', description: '', assignedToUserId: '', dueDate: '' });
  
  const navigate = useNavigate();

  useEffect(() => { loadTasksAndUsers(); }, []);

  const loadTasksAndUsers = async () => {
    try {
      const [tasksData, usersData] = await Promise.all([
        taskService.getAllTasks(),
        userService.getInternUsers()
      ]);
      setTasks(tasksData);
      setUsers(usersData);
    } catch (err) {
      setError("Failed to synchronize task data.");
    } finally { setLoading(false); }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.assignedToUserId) {
      setError("All fields are mandatory.");
      return;
    }
    try {
      await taskService.createTask({
        title: formData.title,
        description: formData.description,
        assignedToUserId: parseInt(formData.assignedToUserId),
        dueDate: formData.dueDate || undefined
      });
      setFormData({ title: '', description: '', assignedToUserId: '', dueDate: '' });
      setShowForm(false);
      setError('');
      loadTasksAndUsers();
    } catch (err) { setError("Could not establish new task."); }
  };

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await taskService.deleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      setTaskToDelete(null); // Close popup
    } catch (err: any) { 
      setError(err.response?.data?.message || 'Deletion failed');
      setTaskToDelete(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 px-4 md:px-0">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Task Console</h1>
          <p className="text-slate-500 font-medium mt-2 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" />
            {tasks.length} active assignments in progress.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <Plus size={18} /> New Assignment
        </button>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-bold flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </motion.div>
      )}

      {/* DELETE CONFIRMATION POPUP */}
      <AnimatePresence>
        {taskToDelete && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setTaskToDelete(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl relative z-10 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash size={28} />
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-2">Delete Task?</h3>
              <p className="text-slate-500 text-sm font-medium mb-8">
                Are you sure you want to delete <span className="text-slate-900 font-bold">"{taskToDelete.title}"</span>? This action is permanent.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setTaskToDelete(null)}
                  className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CREATE TASK MODAL */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative z-10"
            >
              <button onClick={() => setShowForm(false)} className="absolute top-6 right-6 md:top-8 md:right-8 text-slate-400 hover:text-slate-900 transition-colors">
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-black text-slate-900 mb-8">Create New Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Task Title</label>
                  <input
                    type="text" value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., API Infrastructure Design"
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide specific technical details..." rows={3}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Assign To Intern</label>
                  <div className="relative">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <select
                      value={formData.assignedToUserId}
                      onChange={(e) => setFormData({ ...formData, assignedToUserId: e.target.value })}
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 appearance-none transition-all"
                    >
                      <option value="">Select a team member...</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 transition-all"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button type="button" onClick={() => setShowForm(false)} className="order-2 sm:order-1 flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all">Cancel</button>
                  <button type="submit" className="order-1 sm:order-2 flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Publish Task</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DATA TABLE */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Assignment Details</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Activity</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {tasks.map(task => (
                (() => {
                  const isOverdue = !!task.dueDate && task.status !== 'Completed' && task.status !== 'Submitted' && new Date(task.dueDate).getTime() < Date.now();
                  return (
                <tr key={task.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1 flex items-center gap-2">
                      {task.title}
                      {isOverdue && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-black uppercase"><AlertTriangle size={12} />Overdue</span>}
                    </p>
                    <p className="text-xs text-slate-400 font-medium max-w-xs truncate">{task.description}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider
                      ${task.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' : 
                        task.status === 'InProgress' ? 'bg-amber-50 text-amber-600' : 
                        'bg-slate-100 text-slate-500'}
                    `}>
                      {task.status === 'Completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                      {task.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4 text-slate-400">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <Calendar size={14} className={isOverdue ? "text-rose-500" : ""} />
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No deadline"}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <MessageSquare size={14} className={task.commentCount ? "text-indigo-500" : ""} />
                        {task.commentCount || 0}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-200">
                      <button
                        onClick={() => navigate(`/tasks/${task.id}`)}
                        className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all active:scale-90"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => setTaskToDelete({id: task.id, title: task.title})}
                        className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all active:scale-90"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
                  );
                })()
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TaskManagement;
