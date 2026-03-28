<template>
  <div class="file-upload">
    <el-upload
      class="upload-area"
      drag
      :auto-upload="false"
      :on-change="handleFileChange"
      :on-remove="handleRemove"
      :limit="1"
      :accept="acceptTypes"
      :file-list="fileList"
      :disabled="loading"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        拖拽文件到此处或 <em>点击上传</em>
      </div>
      <template #tip>
        <div class="el-upload__tip">
          支持 PDF、Word、图片格式，单个文件不超过 10MB
        </div>
      </template>
    </el-upload>

    <el-progress
      v-if="uploadProgress > 0 && uploadProgress < 100"
      :percentage="uploadProgress"
      :status="uploadProgress === 100 ? 'success' : undefined"
      class="upload-progress"
    />

    <!-- 模式选择 -->
    <div v-if="currentFile && !loading && !uploadedContract" class="mode-select">
      <span class="mode-label">审查模式：</span>
      <el-radio-group v-model="selectedMode" size="default">
        <el-radio-button value="mock">模拟</el-radio-button>
        <el-radio-button value="rag">RAG</el-radio-button>
        <el-radio-button value="llm">LLM</el-radio-button>
      </el-radio-group>
    </div>

    <el-button
      v-if="!uploadedContract"
      type="primary"
      size="large"
      :loading="loading"
      :disabled="!currentFile || loading"
      @click="handleUpload"
      class="upload-btn"
    >
      <template #loading>
        <div class="loading-content">
          <el-icon class="is-loading"><loading /></el-icon>
          <span>{{ loadingText }}</span>
        </div>
      </template>
      {{ loading ? '' : '上传合同' }}
    </el-button>

    <!-- 解析状态 -->
    <div v-if="uploadedContract && !isParsed" class="parse-status">
      <el-alert
        :title="parseStatusText"
        :type="parseStatusType"
        show-icon
        :closable="false"
      >
        <template #default>
          <div v-if="parseStatus === 0">合同已上传，正在等待解析...</div>
          <div v-if="parseStatus === 1">合同解析中，请稍候...</div>
          <div v-if="parseStatus === 3">解析失败，请删除后重新上传</div>
        </template>
      </el-alert>
      <el-button
        v-if="parseStatus === 1"
        type="primary"
        size="large"
        :loading="true"
        class="upload-btn"
        disabled
      >
        等待解析完成...
      </el-button>
    </div>

    <!-- 解析完成，显示开始审查按钮 -->
    <div v-if="uploadedContract && isParsed && parseStatus === 2" class="review-ready">
      <el-alert
        title="解析完成"
        type="success"
        show-icon
        :closable="false"
        class="parse-alert"
      >
        <template #default>
          合同已解析完成，可以开始审查
        </template>
      </el-alert>
      <el-button
        type="primary"
        size="large"
        @click="startReview"
        class="upload-btn"
      >
        开始审查
      </el-button>
      <el-button
        size="large"
        @click="resetUpload"
        class="reset-btn"
      >
        重新上传
      </el-button>
    </div>

    <div v-if="currentFile && !loading && !uploadedContract" class="file-info">
      <el-icon><document /></el-icon>
      <span>{{ currentFile.name }}</span>
      <span class="file-size">{{ formatFileSize(currentFile.size) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { UploadFilled, Loading, Document } from '@element-plus/icons-vue'
import type { UploadFile } from 'element-plus'
import { contractApi } from '../api/contract'
import { useContractStore } from '../stores/contract'

const router = useRouter()
const contractStore = useContractStore()

const currentFile = ref<File | null>(null)
const fileList = ref<UploadFile[]>([])
const loading = ref(false)
const uploadProgress = ref(0)
const loadingText = ref('上传中...')
const selectedMode = ref('mock')
const uploadedContract = ref<any>(null)
const parseStatus = ref(0)
let pollingTimer: number | null = null
let pollingCount = 0
const MAX_POLL_COUNT = 30 // 30 * 2秒 = 60秒超时

const acceptTypes = '.pdf,.docx,.jpg,.jpeg,.png'

const isParsed = computed(() => parseStatus.value === 2)

const parseStatusText = computed(() => {
  switch (parseStatus.value) {
    case 0: return '待解析'
    case 1: return '解析中'
    case 2: return '解析完成'
    case 3: return '解析失败'
    default: return '未知状态'
  }
})

const parseStatusType = computed(() => {
  switch (parseStatus.value) {
    case 0: return 'info'
    case 1: return 'warning'
    case 2: return 'success'
    case 3: return 'error'
    default: return 'info'
  }
})

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const handleFileChange = (file: UploadFile) => {
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (file.raw && file.raw.size > maxSize) {
    ElMessage.error('文件大小不能超过 10MB')
    fileList.value = []
    currentFile.value = null
    return
  }

  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ]

  if (file.raw && !allowedTypes.includes(file.raw.type)) {
    ElMessage.error('不支持的文件格式，请上传 PDF、Word 或图片文件')
    fileList.value = []
    currentFile.value = null
    return
  }

  currentFile.value = file.raw || null
  uploadProgress.value = 0
  uploadedContract.value = null
  parseStatus.value = 0
}

const handleRemove = () => {
  currentFile.value = null
  fileList.value = []
  uploadProgress.value = 0
  uploadedContract.value = null
  parseStatus.value = 0
  stopPolling()
}

const simulateProgress = () => {
  uploadProgress.value = 0
  const interval = setInterval(() => {
    uploadProgress.value += Math.random() * 30
    if (uploadProgress.value >= 90) {
      uploadProgress.value = 90
      clearInterval(interval)
    }
  }, 500)
  return interval
}

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
  pollingCount = 0
}

const pollParseStatus = async () => {
  if (!uploadedContract.value?.id) return

  pollingCount++
  if (pollingCount >= MAX_POLL_COUNT) {
    stopPolling()
    ElMessage.error('解析超时，请稍后刷新页面重试')
    return
  }

  try {
    const contract = await contractApi.getDetail(uploadedContract.value.id)
    parseStatus.value = contract.parseStatus
    uploadedContract.value = contract
    contractStore.setCurrentContract(contract)

    if (contract.parseStatus === 2) {
      stopPolling()
      ElMessage.success('合同解析完成，可以开始审查了')
    } else if (contract.parseStatus === 3) {
      stopPolling()
      ElMessage.error('合同解析失败，请删除后重新上传')
    }
  } catch (error) {
    console.error('查询解析状态失败:', error)
  }
}

const handleUpload = async () => {
  if (!currentFile.value) {
    ElMessage.warning('请先选择文件')
    return
  }

  loading.value = true
  loadingText.value = '上传中...'
  const progressInterval = simulateProgress()

  try {
    // 上传合同文件
    const contract = await contractApi.upload(currentFile.value)
    contractStore.setCurrentContract(contract)
    uploadedContract.value = contract
    parseStatus.value = contract.parseStatus

    clearInterval(progressInterval)
    uploadProgress.value = 100

    if (contract.parseStatus === 2) {
      ElMessage.success('上传成功，合同已解析完成')
    } else if (contract.parseStatus === 0 || contract.parseStatus === 1) {
      ElMessage.success('上传成功，正在等待解析...')
      // 开始轮询解析状态
      pollingTimer = window.setInterval(pollParseStatus, 2000)
    } else if (contract.parseStatus === 3) {
      ElMessage.error('上传成功，但解析失败')
    }
  } catch (error: any) {
    clearInterval(progressInterval)
    uploadProgress.value = 0

    let message = '上传失败，请重试'
    if (error.code === 'ECONNABORTED') {
      message = '请求超时，请检查网络连接'
    } else if (error.response) {
      message = error.response.data?.msg || `服务器错误 (${error.response.status})`
    } else if (error.request) {
      message = '网络连接失败，请检查网络'
    } else if (error.message) {
      message = error.message
    }

    ElMessage.error({
      message,
      duration: 3000,
      showClose: true
    })
  } finally {
    loading.value = false
    loadingText.value = '上传中...'
  }
}

const startReview = async () => {
  if (!uploadedContract.value?.id) {
    ElMessage.warning('请先上传合同')
    return
  }

  // 跳转到合同列表页面发起审查
  router.push('/contracts')
}

const resetUpload = () => {
  stopPolling()
  currentFile.value = null
  fileList.value = []
  uploadProgress.value = 0
  uploadedContract.value = null
  parseStatus.value = 0
  contractStore.reset()
}
</script>

<style scoped>
.file-upload {
  width: 100%;
}

.upload-area {
  margin-bottom: 20px;
}

.upload-area :deep(.el-upload-dragger) {
  padding: 40px;
}

.upload-area :deep(.el-upload-dragger.is-disabled) {
  cursor: not-allowed;
  opacity: 0.6;
}

.el-icon--upload {
  font-size: 67px;
  color: #409eff;
  margin-bottom: 16px;
  transition: transform 0.3s;
}

.upload-area:hover .el-icon--upload {
  transform: scale(1.1);
}

.upload-progress {
  margin-bottom: 20px;
}

.mode-select {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 6px;
}

.mode-label {
  font-weight: 500;
  color: #606266;
}

.upload-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: bold;
  margin-top: 16px;
}

.reset-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  margin-top: 12px;
}

.loading-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  color: #606266;
}

.file-size {
  margin-left: auto;
  color: #909399;
  font-size: 14px;
}

.parse-status {
  margin-top: 16px;
}

.parse-alert {
  margin-bottom: 16px;
}

.review-ready {
  margin-top: 16px;
}
</style>
