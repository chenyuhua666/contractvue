<template>
  <div class="contracts-container">
    <div class="contracts-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" circle size="large" @click="goBack" class="back-btn" />
        <h1>合同管理</h1>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="loadContracts" :loading="loading">
          刷新列表
        </el-button>
      </div>
    </div>

    <div class="contracts-content">
      <el-table
        v-loading="loading"
        :data="contracts"
        stripe
        style="width: 100%"
        empty-text="暂无合同"
      >
        <el-table-column prop="name" label="合同名称" min-width="200" />
        <el-table-column prop="fileType" label="文件类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ getFileTypeText(row.fileType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="parseStatus" label="解析状态" width="120">
          <template #default="{ row }">
            <el-tag :type="getParseStatusType(row.parseStatus)" size="small">
              {{ getParseStatusText(row.parseStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="上传时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              :disabled="row.parseStatus !== 2"
              @click="openReviewDialog(row)"
            >
              发起审查
            </el-button>
            <el-button size="small" @click="viewDetail(row)">
              查看详情
            </el-button>
            <el-button type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" v-if="total > 0">
        <el-pagination
          v-model:current-page="pageNum"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="loadContracts"
          @current-change="loadContracts"
        />
      </div>
    </div>

    <!-- 发起审查对话框 -->
    <el-dialog v-model="reviewDialogVisible" title="发起审查" width="400px">
      <div class="review-dialog-content">
        <p>选择审查模式：</p>
        <el-radio-group v-model="selectedMode" class="mode-radio-group">
          <el-radio value="mock">模拟模式（快速）</el-radio>
          <el-radio value="rag">RAG 模式（推荐）</el-radio>
          <el-radio value="llm">LLM 模式（精准）</el-radio>
        </el-radio-group>
      </div>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="startReview" :loading="startingReview">
          确认发起
        </el-button>
      </template>
    </el-dialog>

    <!-- 合同详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="合同详情" width="600px">
      <div v-if="selectedContract" class="detail-content">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="合同名称">{{ selectedContract.name }}</el-descriptions-item>
          <el-descriptions-item label="文件类型">{{ getFileTypeText(selectedContract.fileType) }}</el-descriptions-item>
          <el-descriptions-item label="解析状态">
            <el-tag :type="getParseStatusType(selectedContract.parseStatus)" size="small">
              {{ getParseStatusText(selectedContract.parseStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="上传时间">{{ formatDate(selectedContract.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="合同ID" :span="2">{{ selectedContract.id }}</el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedContract.rawText" class="raw-text-section">
          <h4>合同内容预览：</h4>
          <el-input
            v-model="selectedContract.rawText"
            type="textarea"
            :rows="6"
            readonly
          />
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Refresh } from '@element-plus/icons-vue'
import { contractApi, reviewApi } from '../api/contract'
import type { Contract } from '../api/contract'
import { useContractStore } from '../stores/contract'

const router = useRouter()
const contractStore = useContractStore()

const loading = ref(false)
const contracts = ref<Contract[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const reviewDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const selectedContract = ref<Contract | null>(null)
const selectedMode = ref('mock')
const startingReview = ref(false)

const goBack = () => {
  router.push('/')
}

const loadContracts = async () => {
  loading.value = true
  try {
    const result = await contractApi.list(pageNum.value, pageSize.value)
    contracts.value = result.records
    total.value = result.total
  } catch (error) {
    ElMessage.error('加载合同列表失败')
  } finally {
    loading.value = false
  }
}

const getFileTypeText = (type: string): string => {
  const map: Record<string, string> = {
    'pdf': 'PDF',
    'docx': 'Word',
    'png': '图片',
    'jpg': '图片',
    'jpeg': '图片'
  }
  return map[type] || type
}

const getParseStatusText = (status: number): string => {
  const map: Record<number, string> = {
    0: '待解析',
    1: '解析中',
    2: '已完成',
    3: '失败'
  }
  return map[status] || '未知'
}

const getParseStatusType = (status: number): string => {
  const map: Record<number, string> = {
    0: 'info',
    1: 'warning',
    2: 'success',
    3: 'danger'
  }
  return map[status] || 'info'
}

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const openReviewDialog = (contract: Contract) => {
  selectedContract.value = contract
  selectedMode.value = 'mock'
  reviewDialogVisible.value = true
}

const startReview = async () => {
  if (!selectedContract.value) return

  startingReview.value = true
  try {
    const task = await reviewApi.start(selectedContract.value.id, selectedMode.value)
    contractStore.setCurrentContract(selectedContract.value)
    contractStore.setCurrentTask(task)

    ElMessage.success({
      message: '审查任务已发起，正在分析...',
      duration: 2000
    })

    reviewDialogVisible.value = false
    router.push(`/result/${task.id}`)
  } catch (error: any) {
    let message = '发起审查失败'
    if (error.response?.data?.msg) {
      message = error.response.data.msg
    } else if (error.message) {
      message = error.message
    }
    ElMessage.error(message)
  } finally {
    startingReview.value = false
  }
}

const viewDetail = async (contract: Contract) => {
  try {
    const detail = await contractApi.getDetail(contract.id)
    selectedContract.value = detail
    detailDialogVisible.value = true
  } catch (error) {
    ElMessage.error('获取合同详情失败')
  }
}

const handleDelete = async (contract: Contract) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除合同"${contract.name}"吗？删除后无法恢复。`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await contractApi.delete(contract.id)
    ElMessage.success('删除成功')

    // 如果删除的是当前选中的合同，清除选中状态
    if (contractStore.currentContract?.id === contract.id) {
      contractStore.setCurrentContract(null)
    }

    loadContracts()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadContracts()
})
</script>

<style scoped>
.contracts-container {
  min-height: 100vh;
  background: #f0f2f5;
}

.contracts-header {
  background: white;
  padding: 20px 40px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  transition: all 0.3s;
}

.back-btn:hover {
  transform: translateX(-4px);
}

.contracts-header h1 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}

.contracts-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.review-dialog-content {
  padding: 10px 0;
}

.review-dialog-content p {
  margin: 0 0 16px 0;
  color: #606266;
}

.mode-radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-content {
  padding: 10px 0;
}

.raw-text-section {
  margin-top: 20px;
}

.raw-text-section h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

@media (max-width: 768px) {
  .contracts-header {
    padding: 15px 20px;
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .contracts-header h1 {
    font-size: 20px;
  }
}
</style>
