export interface ILoginRequest {
  email: string;
  password: string;
}

export interface IRegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role?: string;
}

export interface IAuthResponse {
  id: number;
  token: string;
  fullName: string;
  role: string;
}

export interface ICurrentUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
}
