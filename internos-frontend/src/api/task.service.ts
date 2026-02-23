import axiosInstance from "./axiosInstance";
import type { ITask, ICreateTaskRequest, ITaskSubmission } from "../types/task.types";

class TaskService {
  async getAllTasks() {
    const response = await axiosInstance.get<ITask[]>('/tasks');
    return response.data;
  }

  async getMyTasks() {
    const response = await axiosInstance.get<ITask[]>('/tasks/my-tasks');
    return response.data;
  }

  async getTaskById(id: number) {
    const response = await axiosInstance.get<ITask>(`/tasks/${id}`);
    return response.data;
  }

  async createTask(data: ICreateTaskRequest) {
    const response = await axiosInstance.post('/tasks', data);
    return response.data;
  }

  async deleteTask(taskId: number) {
    try {
      const response = await axiosInstance.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error: any) {
      if (error?.response?.status === 405) {
        const fallbackResponse = await axiosInstance.post(`/tasks/${taskId}/delete`);
        return fallbackResponse.data;
      }
      throw error;
    }
  }

  async updateTaskStatus(taskId: number, statusValue: number) {
    const response = await axiosInstance.patch(`/tasks/${taskId}/status`, statusValue);
    return response.data;
  }

  async completeTask(taskId: number) {
    const response = await axiosInstance.patch(`/tasks/${taskId}/complete`);
    return response.data;
  }

  async submitTask(taskId: number) {
    try {
      const response = await axiosInstance.patch(`/tasks/${taskId}/submit`);
      return response.data;
    } catch (error: any) {
      // Backward compatibility: older API versions only expose /complete
      if (error?.response?.status === 404) {
        const fallbackResponse = await axiosInstance.patch(`/tasks/${taskId}/complete`);
        return fallbackResponse.data;
      }
      throw error;
    }
  }

  async reviewTask(taskId: number, approved: boolean, feedback?: string) {
    const response = await axiosInstance.patch(`/tasks/${taskId}/review`, {
      approved,
      feedback
    });
    return response.data;
  }

  async uploadTaskSubmission(taskId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post(`/tasks/${taskId}/submission`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }

  async getTaskSubmissions(taskId: number) {
    const response = await axiosInstance.get<ITaskSubmission[]>(`/tasks/${taskId}/submissions`);
    return response.data;
  }
}

export default new TaskService();
