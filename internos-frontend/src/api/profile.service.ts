import axiosInstance from "./axiosInstance";

export interface IProfile {
  id: number;
  fullName: string;
  email: string;
  role: string;
  profilePhotoUrl?: string | null;
}

class ProfileService {
  async getMyProfile() {
    const response = await axiosInstance.get<IProfile>('/profile/me');
    return response.data;
  }

  async updateMyProfile(data: { fullName: string; email: string }) {
    const response = await axiosInstance.put('/profile/me', data);
    return response.data;
  }

  async changePassword(data: { oldPassword: string; newPassword: string }) {
    const response = await axiosInstance.post('/profile/change-password', data);
    return response.data;
  }

  async uploadPhoto(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axiosInstance.post('/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
}

export default new ProfileService();
