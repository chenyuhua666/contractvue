import axios from 'axios'

// 统一 axios 实例
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000
})

// 请求拦截器：自动注入 Token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('contract_risk_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一解包 + 401 处理
request.interceptors.response.use(
  (response) => {
    const result = response.data as Result<any>
    if (result.code === 200) {
      return { ...response, data: result.data }
    }
    return Promise.reject(new Error(result.msg || '请求失败'))
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('contract_risk_token')
      localStorage.removeItem('contract_risk_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ===== 共享类型 =====

export interface Result<T> {
  code: number
  msg: string
  data: T
}

export interface Page<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export interface Contract {
  id: number
  userId: number
  name: string
  filePath: string
  fileType: string
  rawText?: string
  parseStatus: number
  createdAt: string
  deleted?: number
}

export interface ReviewTask {
  id: number
  contractId: number
  userId: number
  status: number
  mode: string
  errorMsg?: string
  createdAt: string
  finishedAt?: string
  deleted?: number
}

export interface RiskResult {
  id: number
  taskId: number
  contractId: number
  clauseText: string
  riskType: string
  riskLevel: string
  analysis: string
  impactOnPartyA?: string
  impactOnPartyB?: string
  revisionSuggestion?: string
  replacementText?: string
  clausePosition?: string
  createdAt: string
}

export default request
