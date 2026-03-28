import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000
})

// 请求拦截器：添加 Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('contract_risk_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 后端统一返回结构
export interface Result<T> {
  code: number
  msg: string
  data: T
}

// 分页结构
export interface Page<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

// 合同实体（对应后端 Contract）
export interface Contract {
  id: number
  userId: number
  name: string
  filePath: string
  fileType: string
  rawText?: string
  parseStatus: number  // 0-待解析 1-解析中 2-完成 3-失败
  createdAt: string
  deleted?: number
}

// 审查任务（对应后端 ReviewTask）
export interface ReviewTask {
  id: number
  contractId: number
  userId: number
  status: number  // 0-待执行 1-执行中 2-完成 3-失败
  mode: string    // mock / rag / llm
  errorMsg?: string
  createdAt: string
  finishedAt?: string
  deleted?: number
}

// 风险结果（对应后端 RiskResult）
export interface RiskResult {
  id: number
  taskId: number
  contractId: number
  clauseText: string
  riskType: string
  riskLevel: string  // 红色 / 黄色 / 绿色
  analysis: string
  impactOnPartyA?: string
  impactOnPartyB?: string
  revisionSuggestion?: string
  replacementText?: string
  clausePosition?: string
  createdAt: string
}

// 响应拦截器：自动解包 Result
api.interceptors.response.use(
  (response) => {
    const result = response.data as Result<any>
    if (result.code === 200) {
      return { ...response, data: result.data }
    }
    return Promise.reject(new Error(result.msg || '请求失败'))
  },
  (error) => {
    // 401 未授权，跳转登录页
    if (error.response?.status === 401) {
      localStorage.removeItem('contract_risk_token')
      localStorage.removeItem('contract_risk_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const contractApi = {
  // 上传合同文件
  async upload(file: File): Promise<Contract> {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await api.post<Contract>('/contract/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  // 获取合同列表
  async list(pageNum = 1, pageSize = 10): Promise<Page<Contract>> {
    const { data } = await api.get<Page<Contract>>('/contract/list', {
      params: { pageNum, pageSize }
    })
    return data
  },

  // 获取合同详情
  async getDetail(id: number): Promise<Contract> {
    const { data } = await api.get<Contract>(`/contract/${id}`)
    return data
  },

  // 删除合同
  async delete(id: number): Promise<void> {
    await api.delete(`/contract/${id}`)
  }
}

export const reviewApi = {
  // 发起审查
  async start(contractId: number, mode = 'mock'): Promise<ReviewTask> {
    const { data } = await api.post<ReviewTask>('/review/start', {
      contractId,
      mode
    })
    return data
  },

  // 查询任务状态（轮询）
  async getStatus(taskId: number): Promise<ReviewTask> {
    const { data } = await api.get<ReviewTask>(`/review/${taskId}/status`)
    return data
  },

  // 获取审查结果列表
  async getResult(taskId: number, riskLevel?: string): Promise<RiskResult[]> {
    const { data } = await api.get<RiskResult[]>(`/review/${taskId}/result`, {
      params: riskLevel ? { riskLevel } : {}
    })
    return data
  }
}
