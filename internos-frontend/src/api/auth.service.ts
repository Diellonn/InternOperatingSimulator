import axiosInstance from "./axiosInstance";
import type { ILoginRequest, IRegisterRequest, IAuthResponse, ICurrentUser } from "../types/auth.types";

class AuthService {
  private getUserIdFromToken(token: string): number | null {
    try {
      const base64Url = token.split('.')[1];
      if (!base64Url) return null;

      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
      const payload = JSON.parse(atob(paddedBase64));

      const rawId =
        payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
        payload.nameid ??
        payload.sub;

      const parsedId = Number(rawId);
      return Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null;
    } catch {
      return null;
    }
  }

  async login(credentials: ILoginRequest) {
    const response = await axiosInstance.post<IAuthResponse>('/auth/login', credentials);
    
    if (response.data.token) {
      localStorage.setItem('userId', response.data.id.toString());
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('fullName', response.data.fullName);
      localStorage.setItem('role', response.data.role);
    }
    return response.data;
  }

  async register(data: IRegisterRequest) {
    return await axiosInstance.post('/auth/register', {
      fullName: data.fullName,
      email: data.email,
      password: data.password,
      role: data.role || 'Intern'
    });
  }

  logout() {
    localStorage.removeItem('userId');
    localStorage.removeItem('token');
    localStorage.removeItem('fullName');
    localStorage.removeItem('role');
    window.location.href = '/login';
  }

  getCurrentUser(): ICurrentUser | null {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const fullName = localStorage.getItem('fullName');
    const role = localStorage.getItem('role');

    if (!token || !fullName || !role) {
      return null;
    }

    const parsedStoredId = userId ? Number(userId) : null;
    const resolvedUserId =
      parsedStoredId && Number.isInteger(parsedStoredId) && parsedStoredId > 0
        ? parsedStoredId
        : this.getUserIdFromToken(token);

    if ((!parsedStoredId || parsedStoredId <= 0) && resolvedUserId) {
      localStorage.setItem('userId', resolvedUserId.toString());
    }

    return {
      id: resolvedUserId ?? 0,
      fullName,
      email: '',
      role
    };
  }

  getToken() {
    return localStorage.getItem('token');
  }
}

export default new AuthService();
