import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import type { Contract, ReviewTask, RiskResult } from '../api/contract'

const STORAGE_KEY = 'contract_risk_review'

function saveToStorage(data: { contract: Contract | null; task: ReviewTask | null; results: RiskResult[] }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function loadFromStorage(): { contract: Contract | null; task: ReviewTask | null; results: RiskResult[] } | null {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export const useContractStore = defineStore('contract', () => {
  // 从 localStorage 恢复数据
  const stored = loadFromStorage()
  const currentContract = ref<Contract | null>(stored?.contract || null)
  const currentTask = ref<ReviewTask | null>(stored?.task || null)
  const riskResults = ref<RiskResult[]>(stored?.results || [])
  const contractList = ref<Contract[]>([])
  const loading = ref(false)

  // 监听变化自动持久化
  watch([currentContract, currentTask, riskResults], () => {
    saveToStorage({
      contract: currentContract.value,
      task: currentTask.value,
      results: riskResults.value
    })
  }, { deep: true })

  function setCurrentContract(contract: Contract | null) {
    currentContract.value = contract
  }

  function setCurrentTask(task: ReviewTask | null) {
    currentTask.value = task
  }

  function setRiskResults(results: RiskResult[]) {
    riskResults.value = results
  }

  function setContractList(list: Contract[]) {
    contractList.value = list
  }

  function setLoading(status: boolean) {
    loading.value = status
  }

  function reset() {
    currentContract.value = null
    currentTask.value = null
    riskResults.value = []
    contractList.value = []
    loading.value = false
  }

  return {
    currentContract,
    currentTask,
    riskResults,
    contractList,
    loading,
    setCurrentContract,
    setCurrentTask,
    setRiskResults,
    setContractList,
    setLoading,
    reset
  }
})
