export interface IDashboardStats {
  totalTasks: number;
  pendingTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  totalInterns: number;
  commentsToday: number;
  recentActivity: IActivityLog[];
}

export interface IActivityLog {
  action: string;
  userName: string;
  timestamp: Date;
}