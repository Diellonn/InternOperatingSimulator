import axiosInstance from "./axiosInstance";
import type { IDashboardStats } from "../types/dashboard.types";

class DashboardService {
  async getStats() {
    const response = await axiosInstance.get<IDashboardStats>('/dashboard/stats');
    return response.data;
  }

  downloadCsvReport(stats: IDashboardStats) {
    const generatedAt = new Date();
    const safe = (value: string | number) => {
      const text = String(value ?? '');
      return `"${text.replace(/"/g, '""')}"`;
    };

    const summaryRows = [
      ['Metric', 'Value'],
      ['Total Tasks', stats.totalTasks],
      ['Pending Tasks', stats.pendingTasks],
      ['In Progress Tasks', stats.inProgressTasks],
      ['Completed Tasks', stats.completedTasks],
      ['Total Interns', stats.totalInterns],
      ['Active Mentors', stats.activeMentors],
      ['Comments Today', stats.commentsToday],
      ['Health Score', `${stats.healthScore}%`],
      ['Generated At', generatedAt.toISOString()],
    ];

    const activityRows = [
      [],
      ['Recent Activity'],
      ['Operator', 'Action', 'Timestamp'],
      ...stats.recentActivity.map((item) => [
        item.userName,
        item.action,
        new Date(item.timestamp).toISOString(),
      ]),
    ];

    const csv = [...summaryRows, ...activityRows]
      .map((row) => row.map((cell) => safe(cell)).join(','))
      .join('\r\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const fileName = `dashboard-report-${generatedAt.toISOString().replace(/[:.]/g, '-')}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

export default new DashboardService();
