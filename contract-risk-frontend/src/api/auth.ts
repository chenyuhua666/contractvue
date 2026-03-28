import axios from 'axios'

const authApi = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000
})

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

export interface Result<T> {
  code: number
  msg: string
  data: T
}

// 响应拦截器
authApi.interceptors.response.use(
  (response) => {
    const result = response.data as Result<any>
    if (result.code === 200) {
      return { ...response, data: result.data }
    }
    return Promise.reject(new Error(result.msg || '请求失败'))
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const authApiService = {
  // 登录
  async login(request: LoginRequest): Promise<LoginResponse> {
    const { data } = await authApi.post<LoginResponse>('/auth/login', request)
    return data
  },

  // 注册
  async register(request: LoginRequest): Promise<LoginResponse> {
    const { data } = await authApi.post<LoginResponse>('/auth/register', request)
    return data
  }
}
