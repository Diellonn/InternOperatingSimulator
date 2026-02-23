export interface IDashboardStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  totalInterns: number;
  activeMentors: number;
  commentsToday: number;
  healthScore: number;
  recentActivity: IActivityLog[];
}

export interface IActivityLog {
  action: string;
  userName: string;
  timestamp: Date;
}
