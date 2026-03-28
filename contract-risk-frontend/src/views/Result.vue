<template>
  <div class="result-container">
    <div class="result-header">
      <div class="header-left">
        <el-button
          :icon="ArrowLeft"
          circle
          size="large"
          @click="goBack"
          class="back-btn"
        />
        <div class="header-info">
          <h1>分析结果</h1>
          <p v-if="!loading">分析完成时间：{{ currentTime }}</p>
        </div>
      </div>
      <div class="header-actions">
        <el-dropdown @command="handleCommand" style="margin-right: 12px;">
          <span class="user-dropdown-small">
            <el-icon><user /></el-icon>
            <span>{{ username }}</span>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item disabled>
                <el-tag size="small">{{ role }}</el-tag>
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><switch-button /></el-icon>
                退出登录
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button
          type="success"
          :icon="Download"
          @click="downloadReport"
          :disabled="loading"
        >
          下载报告
        </el-button>
      </div>
    </div>

    <div class="result-content">
      <el-skeleton :loading="loading" :rows="12" animated>
        <template #template>
          <div class="skeleton-container">
            <el-skeleton-item variant="h1" style="width: 100%; height: 200px; margin-bottom: 20px;" />
            <el-skeleton-item variant="h3" style="width: 100%; height: 300px; margin-bottom: 20px;" />
            <el-skeleton-item variant="h3" style="width: 100%; height: 300px;" />
          </div>
        </template>

        <template #default>
          <div v-if="hasError" class="error-state">
            <el-result
              icon="error"
              title="加载失败"
              sub-title="无法获取分析结果，请稍后重试"
            >
              <template #extra>
                <el-button type="primary" @click="retry">重新加载</el-button>
                <el-button @click="goBack">返回首页</el-button>
              </template>
            </el-result>
          </div>

          <div v-else-if="!analysisResult && !loading" class="empty-state">
            <el-result
              icon="warning"
              title="暂无数据"
              sub-title="未找到分析结果，请先上传合同文件"
            >
              <template #extra>
                <el-button type="primary" @click="goBack">返回首页</el-button>
              </template>
            </el-result>
          </div>

          <div v-else-if="analysisResult" class="result-data">
            <el-alert
              v-if="summary.overallRisk === '高风险'"
              title="风险警告"
              type="error"
              :closable="false"
              show-icon
              class="risk-alert"
            >
              <template #default>
                该合同存在较高风险，建议在签署前咨询专业法律顾问
              </template>
            </el-alert>

            <RiskSummary :summary="summary" />

            <!-- 风险级别筛选 -->
            <div class="risk-filter" v-if="risks.length">
              <span class="filter-label">风险筛选：</span>
              <el-radio-group v-model="riskFilter" size="small">
                <el-radio-button value="">全部</el-radio-button>
                <el-radio-button value="高风险">高风险</el-radio-button>
                <el-radio-button value="中风险">中风险</el-radio-button>
                <el-radio-button value="低风险">低风险</el-radio-button>
              </el-radio-group>
            </div>

            <RiskList :risks="filteredRisks" />
            <SuggestionPanel :suggestions="suggestions" />

            <div class="result-footer">
              <el-divider />
              <div class="footer-content">
                <el-icon><warning-filled /></el-icon>
                <span>本分析结果由 AI 生成，仅供参考。重要合同建议咨询专业律师。</span>
              </div>
            </div>
          </div>
        </template>
      </el-skeleton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Download, WarningFilled, User, SwitchButton } from '@element-plus/icons-vue'
import { useContractStore } from '../stores/contract'
import { useUserStore } from '../stores/user'
import { reviewApi, contractApi } from '../api/contract'
import RiskSummary from '../components/RiskSummary.vue'
import RiskList from '../components/RiskList.vue'
import SuggestionPanel from '../components/SuggestionPanel.vue'

const router = useRouter()
const route = useRoute()
const contractStore = useContractStore()
const userStore = useUserStore()

const loading = computed(() => contractStore.loading)
const currentContract = computed(() => contractStore.currentContract)
const currentTask = computed(() => contractStore.currentTask)
const riskResults = computed(() => contractStore.riskResults)
const hasError = ref(false)
const currentTime = ref('')
const riskFilter = ref('')
let pollingTimer: number | null = null

const username = computed(() => userStore.username)
const role = computed(() => userStore.role === 'ADMIN' ? '管理员' : '用户')

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm(
        '确定要退出登录吗？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )

      stopPolling()
      userStore.logout()
      contractStore.reset()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch {
      // 用户取消
    }
  }
}

interface AnalysisResult {
  summary: {
    highRisk: number
    mediumRisk: number
    lowRisk: number
    totalRisk: number
    contractName: string
    analyzeTime: string
    overallRisk: string
  }
  risks: Array<{
    level: string
    title: string
    content: string
    description: string
    suggestion: string
    clausePosition?: string
    impactOnPartyA?: string
    impactOnPartyB?: string
    replacementText?: string
    expanded?: boolean
  }>
  suggestions: Array<{
    type: string
    title: string
    content: string
  }>
}

// 将后端的 RiskResult 转换为前端展示格式
const analysisResult = computed<AnalysisResult | null>(() => {
  if (!riskResults.value || riskResults.value.length === 0) {
    return null
  }

  const results = riskResults.value
  const highRisk = results.filter(r => r.riskLevel === '红色').length
  const mediumRisk = results.filter(r => r.riskLevel === '黄色').length
  const lowRisk = results.filter(r => r.riskLevel === '绿色').length

  return {
    summary: {
      highRisk,
      mediumRisk,
      lowRisk,
      totalRisk: results.length,
      contractName: currentContract.value?.name || '合同',
      analyzeTime: currentTime.value,
      overallRisk: highRisk > 0 ? '高风险' : mediumRisk > 0 ? '中风险' : '低风险'
    },
    risks: results.map(r => ({
      level: r.riskLevel === '红色' ? '高风险' : r.riskLevel === '黄色' ? '中风险' : '低风险',
      title: r.riskType,
      content: r.clauseText,
      description: r.analysis,
      suggestion: r.revisionSuggestion || '',
      clausePosition: r.clausePosition || '',
      impactOnPartyA: r.impactOnPartyA || '',
      impactOnPartyB: r.impactOnPartyB || '',
      replacementText: r.replacementText || '',
      expanded: false
    })),
    suggestions: results
      .filter(r => r.revisionSuggestion)
      .map(r => ({
        type: r.riskLevel === '红色' ? '重要' : r.riskLevel === '黄色' ? '建议' : '提示',
        title: r.riskType,
        content: r.revisionSuggestion || ''
      }))
  }
})

const summary = computed(() => analysisResult.value?.summary ?? {
  highRisk: 0,
  mediumRisk: 0,
  lowRisk: 0,
  totalRisk: 0,
  contractName: '合同',
  analyzeTime: '',
  overallRisk: ''
})
const risks = computed(() => analysisResult.value?.risks ?? [])
const suggestions = computed(() => analysisResult.value?.suggestions || [])

const filteredRisks = computed(() => {
  const allRisks = risks.value
  if (!riskFilter.value) return allRisks
  return allRisks.filter(r => r.level === riskFilter.value)
})

const goBack = async () => {
  if (analysisResult.value) {
    try {
      await ElMessageBox.confirm(
        '返回首页将清除当前分析结果，确定要返回吗？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      stopPolling()
      contractStore.reset()
      router.push('/')
    } catch {
      // 用户取消
    }
  } else {
    stopPolling()
    contractStore.reset()
    router.push('/')
  }
}

const downloadReport = () => {
  ElMessage.info('报告下载功能开发中...')
}

const retry = () => {
  hasError.value = false
  loadData()
}

// 停止轮询
const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

// 轮询任务状态
const pollTaskStatus = async () => {
  if (!currentTask.value?.id) {
    return
  }

  try {
    const task = await reviewApi.getStatus(currentTask.value.id)
    contractStore.setCurrentTask(task)

    // 状态：0-待执行 1-执行中 2-完成 3-失败
    if (task.status === 2) {
      // 任务完成，停止轮询，获取结果
      stopPolling()
      await loadResults()
    } else if (task.status === 3) {
      // 任务失败
      stopPolling()
      hasError.value = true
      ElMessage.error(task.errorMsg || '分析失败，请重试')
      contractStore.setLoading(false)
    }
  } catch (error) {
    console.error('轮询任务状态失败:', error)
  }
}

// 获取审查结果
const loadResults = async () => {
  if (!currentTask.value?.id) {
    return
  }

  try {
    const results = await reviewApi.getResult(currentTask.value.id)
    contractStore.setRiskResults(results)
    currentTime.value = new Date().toLocaleString('zh-CN')
    contractStore.setLoading(false)
  } catch (error) {
    hasError.value = true
    ElMessage.error('获取分析结果失败')
    contractStore.setLoading(false)
  }
}

const loadData = async () => {
  // 优先从 URL 参数获取 taskId
  const taskIdFromUrl = route.params.taskId as string

  if (taskIdFromUrl && (!currentTask.value?.id || currentTask.value.id !== Number(taskIdFromUrl))) {
    // URL 有 taskId 且与 store 不匹配，通过 API 恢复
    contractStore.setLoading(true)
    hasError.value = false

    try {
      const task = await reviewApi.getStatus(Number(taskIdFromUrl))
      contractStore.setCurrentTask(task)

      // 获取合同详情
      if (task.contractId) {
        const contract = await contractApi.getDetail(task.contractId)
        contractStore.setCurrentContract(contract)
      }

      if (task.status === 2) {
        await loadResultsByTaskId(Number(taskIdFromUrl))
      } else if (task.status === 3) {
        hasError.value = true
        ElMessage.error(task.errorMsg || '分析失败')
        contractStore.setLoading(false)
      } else {
        pollingTimer = window.setInterval(() => pollTaskStatusById(Number(taskIdFromUrl)), 2000)
      }
      return
    } catch (error) {
      hasError.value = true
      ElMessage.error('加载数据失败，请重试')
      contractStore.setLoading(false)
      return
    }
  }

  // 使用 store 中的数据
  if (!currentContract.value?.id || !currentTask.value?.id) {
    ElMessage.warning('未找到合同或任务信息，请先上传合同')
    router.push('/')
    return
  }

  contractStore.setLoading(true)
  hasError.value = false

  try {
    // 检查任务状态
    const task = await reviewApi.getStatus(currentTask.value.id)
    contractStore.setCurrentTask(task)

    if (task.status === 2) {
      // 任务已完成，直接获取结果
      await loadResults()
    } else if (task.status === 3) {
      // 任务失败
      hasError.value = true
      ElMessage.error(task.errorMsg || '分析失败')
      contractStore.setLoading(false)
    } else {
      // 任务进行中，开始轮询（每 2 秒查询一次）
      pollingTimer = window.setInterval(pollTaskStatus, 2000)
    }
  } catch (error) {
    hasError.value = true
    ElMessage.error('加载数据失败，请重试')
    contractStore.setLoading(false)
  }
}

// 通过 taskId 轮询任务状态
const pollTaskStatusById = async (taskId: number) => {
  try {
    const task = await reviewApi.getStatus(taskId)
    contractStore.setCurrentTask(task)

    if (task.status === 2) {
      stopPolling()
      await loadResultsByTaskId(taskId)
    } else if (task.status === 3) {
      stopPolling()
      hasError.value = true
      ElMessage.error(task.errorMsg || '分析失败，请重试')
      contractStore.setLoading(false)
    }
  } catch (error) {
    console.error('轮询任务状态失败:', error)
  }
}

// 通过 taskId 获取审查结果
const loadResultsByTaskId = async (taskId: number) => {
  try {
    const results = await reviewApi.getResult(taskId)
    contractStore.setRiskResults(results)
    currentTime.value = new Date().toLocaleString('zh-CN')
    contractStore.setLoading(false)
  } catch (error) {
    hasError.value = true
    ElMessage.error('获取分析结果失败')
    contractStore.setLoading(false)
  }
}

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.result-container {
  min-height: 100vh;
  background: #f0f2f5;
}

.result-header {
  background: white;
  padding: 20px 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  transition: all 0.3s;
}

.back-btn:hover {
  transform: translateX(-4px);
}

.header-info h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.header-info p {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: #909399;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-dropdown-small {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #f5f7fa;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s;
  color: #606266;
  font-size: 14px;
}

.user-dropdown-small:hover {
  background: #e4e7ed;
  color: #303133;
}

.result-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

.skeleton-container {
  padding: 20px;
}

.error-state,
.empty-state {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.risk-filter {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.filter-label {
  font-weight: 500;
  color: #606266;
}

.risk-alert {
  margin-bottom: 20px;
  font-size: 16px;
}

.result-data {
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.result-footer {
  margin-top: 40px;
}

.footer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #909399;
  font-size: 14px;
  padding: 20px;
}

@media (max-width: 768px) {
  .result-header {
    padding: 15px 20px;
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .header-left {
    width: 100%;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions button {
    width: 100%;
  }

  .header-info h1 {
    font-size: 20px;
  }
}
</style>
