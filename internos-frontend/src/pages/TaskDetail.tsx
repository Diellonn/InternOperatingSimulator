import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import taskService from '../api/task.service';
import commentService from '../api/comment.service';
import type { ITask, IComment, ITaskSubmission } from '../types/task.types';
import authService from '../api/auth.service';
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  Upload,
  Download,
  FileText,
  AlertCircle,
  Clock,
  Calendar,
  AlertTriangle
} from 'lucide-react';

const TaskDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [task, setTask] = useState<ITask | null>(null);
  const [comments, setComments] = useState<IComment[]>([]);
  const [submissions, setSubmissions] = useState<ITaskSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!id) return;
    
    const fetchData = async () => {
      try {
        const [taskData, commentsData, submissionsData] = await Promise.all([
          taskService.getTaskById(parseInt(id)),
          commentService.getTaskComments(parseInt(id)),
          taskService.getTaskSubmissions(parseInt(id))
        ]);
        setTask(taskData);
        setComments(commentsData);
        setSubmissions(submissionsData);
      } catch (err) {
        setError("Failed to synchronize task data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;
    setSubmittingComment(true);
    try {
      await commentService.addComment(parseInt(id), newComment);
      setNewComment('');
      const updatedComments = await commentService.getTaskComments(parseInt(id));
      setComments(updatedComments);
    } catch (err) {
      setError("Comment delivery failed.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUploadSubmission = async () => {
    if (!id || !selectedFile) return;
    setUploading(true);
    try {
      await taskService.uploadTaskSubmission(parseInt(id), selectedFile);
      const [updatedTask, updatedSubmissions] = await Promise.all([
        taskService.getTaskById(parseInt(id)),
        taskService.getTaskSubmissions(parseInt(id))
      ]);
      setTask(updatedTask);
      setSubmissions(updatedSubmissions);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleReview = async (approved: boolean) => {
    if (!id) return;
    const feedback = window.prompt(approved ? 'Approval note:' : 'Reason for revision:');
    if (!approved && feedback === null) return;

    setReviewLoading(true);
    try {
      await taskService.reviewTask(parseInt(id), approved, feedback || undefined);
      const updatedTask = await taskService.getTaskById(parseInt(id));
      setTask(updatedTask);
    } catch (err: any) {
      setError("Review process failed.");
    } finally {
      setReviewLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
      <p className="text-slate-500 font-bold tracking-tighter">Syncing Workspace...</p>
    </div>
  );

  if (error || !task) return (
    <div className="max-w-2xl mx-auto mt-20 p-10 bg-rose-50 border border-rose-100 rounded-[3rem] text-center">
      <AlertCircle className="mx-auto text-rose-500 mb-4" size={48} />
      <h2 className="text-2xl font-black text-rose-900 mb-2">System Error</h2>
      <p className="text-rose-700 mb-6 font-medium">{error || "Task footprint not found."}</p>
      <button onClick={() => navigate(-1)} className="px-8 py-3 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-200 hover:bg-rose-700 transition-all">Go Back</button>
    </div>
  );

  const isReviewer = currentUser?.role === 'Admin' || currentUser?.role === 'Mentor';
  const isAssignedToMe = task.assignedToUserId === currentUser?.id;
  const isOverdue = !!task.dueDate && task.status !== 'Completed' && task.status !== 'Submitted' && new Date(task.dueDate).getTime() < Date.now();

  return (
    <div className="space-y-8 pb-20">
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <button onClick={() => navigate(-1)} className="group flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-all">
          <div className="p-2 bg-white rounded-xl shadow-sm group-hover:bg-indigo-50 transition-colors border border-slate-100">
            <ArrowLeft size={18} />
          </div>
          <span className="text-sm uppercase tracking-widest font-black">All Tasks</span>
        </button>

        <div className="flex items-center gap-3">
          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-colors duration-500 ${
            task.status === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
            task.status === 'Submitted' ? 'bg-blue-50 text-blue-700 border-blue-100' :
            'bg-indigo-50 text-indigo-700 border-indigo-100'
          }`}>
            {task.status}
          </span>
          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-colors duration-500 inline-flex items-center gap-1.5 ${
            isOverdue ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-slate-50 text-slate-700 border-slate-100'
          }`}>
            {isOverdue ? <AlertTriangle size={12} /> : <Calendar size={12} />}
            {task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : 'No Deadline'}
          </span>
          
          {isReviewer && task.status === 'Submitted' && (
            <div className="flex gap-2">
              <button disabled={reviewLoading} onClick={() => handleReview(true)} className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all">Approve</button>
              <button disabled={reviewLoading} onClick={() => handleReview(false)} className="px-6 py-2 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-100 transition-all">Revise</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Task Core */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-10 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-2 transition-colors duration-700 ${
              task.status === 'Completed' ? 'bg-emerald-500' : 
              task.status === 'Submitted' ? 'bg-blue-500' : 'bg-indigo-600'
            }`} />
            
            <div className="mb-10">
              <div className="flex items-center gap-2 text-slate-400 mb-6 font-bold text-[10px] uppercase tracking-widest">
                <FileText size={14} className="text-indigo-500" /> System Assignment
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight mb-6">{task.title}</h1>
              <div className="text-slate-600 font-medium leading-relaxed text-lg whitespace-pre-wrap">
                {task.description}
              </div>
            </div>

            {/* Submission Engine */}
            {isAssignedToMe && task.status !== 'Completed' && (
              <div className="mt-12 p-1 bg-slate-50 rounded-[2rem] border border-slate-200/60 overflow-hidden">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => { e.preventDefault(); setDragActive(false); const file = e.dataTransfer.files?.[0]; if(file) setSelectedFile(file); }}
                  className={`m-2 border-2 border-dashed rounded-[1.5rem] p-10 text-center transition-all ${dragActive ? 'border-indigo-500 bg-indigo-50 scale-[0.98]' : 'border-slate-300 bg-white'}`}
                >
                  <Upload className={`mx-auto mb-4 transition-colors ${dragActive ? 'text-indigo-600' : 'text-slate-300'}`} size={40} />
                  <p className="text-sm font-black text-slate-800 uppercase tracking-widest">Upload Deliverable</p>
                  <p className="text-xs text-slate-400 mt-2 font-medium">Drop files or click the browser</p>
                  <input type="file" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden" id="fileInput" />
                  <label htmlFor="fileInput" className="mt-6 inline-block px-8 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-600 transition-all">Select File</label>
                  {selectedFile && <div className="mt-4 text-xs font-bold text-indigo-600 bg-indigo-50 py-2 px-4 rounded-lg inline-block">{selectedFile.name}</div>}
                </div>
                <div className="p-4">
                  <button 
                    disabled={!selectedFile || uploading} 
                    onClick={handleUploadSubmission}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all"
                  >
                    {uploading ? 'Processing Payload...' : 'Submit Deliverable'}
                  </button>
                </div>
              </div>
            )}

            {/* File History */}
            <div className="mt-16">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <Clock size={12} /> Version History ({submissions.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {submissions.map((sub, i) => (
                  <a key={i} href={sub.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-3xl hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-50/50 transition-all group">
                    <div className="flex items-center gap-4 truncate">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Download size={20} />
                      </div>
                      <div className="truncate">
                        <p className="text-sm font-black text-slate-800 truncate">{sub.fileName}</p>
                        <p className="text-[10px] font-bold text-slate-400">{(sub.sizeBytes / 1024).toFixed(0)}KB • {new Date(sub.uploadedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Discussion (Sidebar) */}
        <div className="xl:col-span-1">
          <div className="bg-slate-900 rounded-[3rem] flex flex-col h-[800px] shadow-2xl shadow-indigo-900/30 overflow-hidden sticky top-8">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                Live Pulse <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              </h2>
              <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black text-indigo-400">{comments.length}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar-dark">
              {comments.map((c, i) => (
                <div key={i} className="flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-xs font-black text-white shrink-0 shadow-lg shadow-indigo-500/20">
                    {c.userName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-baseline mb-2">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{c.userName}</p>
                      <span className="text-[9px] font-bold text-slate-500">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 rounded-[1.5rem] rounded-tl-none p-5 text-sm text-slate-300 leading-relaxed font-medium">
                      {c.content}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-white/5 backdrop-blur-2xl border-t border-white/5">
              <form onSubmit={handleAddComment} className="relative">
                <input 
                  type="text" 
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Post an update..."
                  className="w-full bg-slate-800 text-white pl-6 pr-16 py-5 rounded-[1.5rem] border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600 text-sm font-bold"
                />
                <button 
                  disabled={submittingComment || !newComment.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/40 disabled:opacity-20 disabled:shadow-none"
                >
                  {submittingComment ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
