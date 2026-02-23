import { useState, useEffect } from 'react';
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
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {activities.length === 0 ? (
        <div className="bg-white rounded-xl shadow p-8 text-center">
          <p className="text-gray-600">No activity logs found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
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
      )}
    </div>
  );
};

export default ActivityLog;
