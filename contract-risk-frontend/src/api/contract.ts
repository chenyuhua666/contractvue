import request, { type Contract, type ReviewTask, type RiskResult, type Page } from '../utils/request'

export { type Contract, type ReviewTask, type RiskResult, type Page }

export const contractApi = {
  async upload(file: File): Promise<Contract> {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await request.post<Contract>('/contract/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return data
  },

  async list(pageNum = 1, pageSize = 10): Promise<Page<Contract>> {
    const { data } = await request.get<Page<Contract>>('/contract/list', {
      params: { pageNum, pageSize }
    })
    return data
  },

  async getDetail(id: number): Promise<Contract> {
    const { data } = await request.get<Contract>(`/contract/${id}`)
    return data
  },

  async delete(id: number): Promise<void> {
    await request.delete(`/contract/${id}`)
  }
}

export const reviewApi = {
  async start(contractId: number, mode = 'mock'): Promise<ReviewTask> {
    const { data } = await request.post<ReviewTask>('/review/start', { contractId, mode })
    return data
  },

  async getStatus(taskId: number): Promise<ReviewTask> {
    const { data } = await request.get<ReviewTask>(`/review/${taskId}/status`)
    return data
  },

  async getResult(taskId: number, riskLevel?: string): Promise<RiskResult[]> {
    const { data } = await request.get<RiskResult[]>(`/review/${taskId}/result`, {
      params: riskLevel ? { riskLevel } : {}
    })
    return data
  }
}
