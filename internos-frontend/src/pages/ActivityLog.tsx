import { useState, useEffect, useMemo } from 'react';
import { Clock, User, FileText, AlertCircle } from 'lucide-react';
import activityService from '../api/activity.service';

interface Activity {
  id: number;
  action: string;
  description?: string;
  timestamp: string;
  userName: string;
  taskTitle: string;
  type?: string;
}

const ActivityLog = () => {
  const ITEMS_PER_PAGE = 8;
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        const data = await activityService.getActivityLogs();
        setActivities(data);
        setError('');
      } catch (err: any) {
        console.error('Error:', err);
        setError(err.response?.data?.message || 'Failed to load activity logs');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const filteredActivities = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return activities;

    return activities.filter((activity) => {
      return (
        activity.action.toLowerCase().includes(query) ||
        activity.userName.toLowerCase().includes(query) ||
        activity.taskTitle.toLowerCase().includes(query)
      );
    });
  }, [activities, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredActivities.length / ITEMS_PER_PAGE));
  const clampedPage = Math.min(currentPage, totalPages);
  const pageStart = (clampedPage - 1) * ITEMS_PER_PAGE;
  const paginatedActivities = filteredActivities.slice(pageStart, pageStart + ITEMS_PER_PAGE);

  const getActivityTypeColor = (action: string) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('create')) return 'bg-green-100 text-green-700';
    if (actionLower.includes('update') || actionLower.includes('complete')) return 'bg-blue-100 text-blue-700';
    if (actionLower.includes('comment')) return 'bg-purple-100 text-purple-700';
    if (actionLower.includes('login')) return 'bg-yellow-100 text-yellow-700';
    if (actionLower.includes('delete')) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading activity logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Activity Log</h1>
        <p className="text-gray-600 mt-2">Track all system activities and user actions</p>
      </div>

      <div className="bg-white rounded-xl shadow p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4 md:justify-between">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by action, operator, or task..."
          className="w-full md:max-w-md px-4 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
        />
        <p className="text-sm text-slate-600 font-medium">
          Showing {filteredActivities.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + ITEMS_PER_PAGE, filteredActivities.length)} of {filteredActivities.length}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {filteredActivities.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-600">{searchTerm ? 'No activity logs match your search' : 'No activity logs found'}</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
          {paginatedActivities.map((activity) => (
            <div key={activity.id} className="bg-white p-5 rounded-xl shadow hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${getActivityTypeColor(activity.action)}`}>
                  <FileText size={20} />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">{activity.action}</h3>
                      {activity.taskTitle && (
                        <p className="text-sm text-gray-600 mt-1">Task: {activity.taskTitle}</p>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-2 ${getActivityTypeColor(activity.action)}`}>
                      {activity.action}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User size={14} />
                      {activity.userName}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      {new Date(activity.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>

          <div className="flex items-center justify-between bg-white rounded-xl shadow px-4 py-3">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={clampedPage === 1}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Previous
            </button>
            <span className="text-sm font-medium text-slate-600">
              Page {clampedPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={clampedPage === totalPages}
              className="px-3 py-1.5 text-sm font-semibold rounded-lg border border-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityLog;
