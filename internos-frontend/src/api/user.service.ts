import axiosInstance from "./axiosInstance";

export interface User {
  id: number;
  fullName: string;
  email: string;
  role: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  role: string;
}

export interface UserDependencies {
  assignedTasks: number;
  createdTasks: number;
  totalTasks: number;
  comments: number;
  activities: number;
  totalDependencies: number;
  hasDependencies: boolean;
}

class UserService {
  async getUserDependencies(id: number) {
    try {
      const response = await axiosInstance.get<UserDependencies>(`/users/${id}/dependencies`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user dependencies:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      const response = await axiosInstance.get<User[]>('/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  async getUserById(id: number) {
    try {
      const response = await axiosInstance.get<User>(`/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async getInternUsers() {
    try {
      const response = await axiosInstance.get<User[]>('/users/interns');
      return response.data;
    } catch (error) {
      console.error('Error fetching interns:', error);
      throw error;
    }
  }

  async getMentorUsers() {
    try {
      const response = await axiosInstance.get<User[]>('/users/mentors');
      return response.data;
    } catch (error) {
      console.error('Error fetching mentors:', error);
      throw error;
    }
  }

  async getChatPartners() {
    try {
      const response = await axiosInstance.get<User[]>('/users/chat-partners');
      return response.data;
    } catch (error) {
      console.error('Error fetching chat partners:', error);
      throw error;
    }
  }

  async createUser(data: CreateUserRequest) {
    try {
      const response = await axiosInstance.post<{ message: string; user: User }>('/users', data);
      return response.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, data: Partial<CreateUserRequest>) {
    try {
      const response = await axiosInstance.put<{ message: string; user: User }>(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: number, reassignToUserId?: number) {
    try {
      const response = await axiosInstance.delete<{ message: string }>(`/users/${id}`, {
        params: reassignToUserId ? { reassignToUserId } : undefined
      });
      return response.data;
    } catch (error: any) {
      console.error('Error deleting user:', error?.response?.data || error);
      throw error;
    }
  }
}

export default new UserService();
