import axiosInstance from "./axiosInstance";
import type { IComment } from "../types/task.types";

class CommentService {
  async addComment(taskId: number, content: string) {
    const response = await axiosInstance.post(`/comments`, null, {
      params: {
        taskId,
        content
      }
    });
    return response.data;
  }

  async getTaskComments(taskId: number) {
    const response = await axiosInstance.get<IComment[]>(`/comments/task/${taskId}`);
    return response.data;
  }
}

export default new CommentService();
