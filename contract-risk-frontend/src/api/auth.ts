import request from '../utils/request'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  userId: number
  username: string
  role: string
}

export const authApi = {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const { data: res } = await request.post<LoginResponse>('/api/auth/login', data)
    return res
  },

  async register(data: LoginRequest): Promise<LoginResponse> {
    const { data: res } = await request.post<LoginResponse>('/api/auth/register', data)
    return res
  }
}
