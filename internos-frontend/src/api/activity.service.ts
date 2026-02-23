import axiosInstance from "./axiosInstance";

export interface ActivityLog {
  id: number;
  action: string;
  timestamp: string;
  userName: string;
  taskTitle: string;
}

class ActivityService {
  async getActivityLogs() {
    try {
      const response = await axiosInstance.get<ActivityLog[]>('/activity');
      return response.data;
    } catch (error) {
      console.error('Error fetching activity logs:', error);
      throw error;
    }
  }
}

export default new ActivityService();
