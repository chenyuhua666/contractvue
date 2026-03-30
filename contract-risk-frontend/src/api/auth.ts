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
  async login(request: LoginRequest): Promise<LoginResponse> {
    const { data } = await request.post<LoginResponse>('/auth/login', request)
    return data
  },

  async register(request: LoginRequest): Promise<LoginResponse> {
    const { data } = await request.post<LoginResponse>('/auth/register', request)
    return data
  }
}
