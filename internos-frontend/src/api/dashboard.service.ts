import axiosInstance from "./axiosInstance";
import type { IDashboardStats } from "../types/dashboard.types";

class DashboardService {
  async getStats() {
    const response = await axiosInstance.get<IDashboardStats>('/dashboard/stats');
    return response.data;
  }
}

export default new DashboardService();