<template>
  <div class="home-container">
    <div class="user-info">
      <el-dropdown @command="handleCommand">
        <span class="user-dropdown">
          <el-icon><user /></el-icon>
          <span>{{ username }}</span>
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
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
    </div>

    <div class="home-content">
      <div class="hero-section">
        <div class="logo">
          <el-icon :size="60"><document-checked /></el-icon>
        </div>
        <h1 class="title">合同风险审查系统</h1>
        <p class="subtitle">AI 智能识别合同风险，保护您的权益</p>
      </div>

      <el-card class="upload-card" shadow="always">
        <FileUpload />
      </el-card>

      <div class="features">
        <div class="feature-item" @click="goToContracts">
          <el-icon :size="24" color="#409eff"><folder /></el-icon>
          <span>合同管理</span>
        </div>
        <div class="feature-item">
          <el-icon :size="24" color="#409eff"><upload-filled /></el-icon>
          <span>快速上传</span>
        </div>
        <div class="feature-item">
          <el-icon :size="24" color="#67c23a"><cpu /></el-icon>
          <span>AI 分析</span>
        </div>
        <div class="feature-item">
          <el-icon :size="24" color="#e6a23c"><warning /></el-icon>
          <span>风险识别</span>
        </div>
        <div class="feature-item">
          <el-icon :size="24" color="#f56c6c"><edit /></el-icon>
          <span>修改建议</span>
        </div>
      </div>

      <div class="tips">
        <el-alert
          title="使用提示"
          type="info"
          :closable="false"
          show-icon
        >
          <template #default>
            <ul>
              <li>支持上传 PDF、Word、图片格式的合同文件</li>
              <li>文件大小不超过 10MB</li>
              <li>分析时间约 30-60 秒，请耐心等待</li>
              <li>分析结果仅供参考，重要合同建议咨询专业律师</li>
            </ul>
          </template>
        </el-alert>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { User, ArrowDown, SwitchButton, DocumentChecked, UploadFilled, Cpu, Warning, Edit, Folder } from '@element-plus/icons-vue'
import FileUpload from '../components/FileUpload.vue'
import { useUserStore } from '../stores/user'
import { useContractStore } from '../stores/contract'

const router = useRouter()
const userStore = useUserStore()
const contractStore = useContractStore()

const username = computed(() => userStore.username)
const role = computed(() => userStore.role === 'ADMIN' ? '管理员' : '用户')

const goToContracts = () => {
  router.push('/contracts')
}

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

      userStore.logout()
      contractStore.reset()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch {
      // 用户取消
    }
  }
}
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.user-info {
  position: absolute;
  top: 20px;
  right: 30px;
  z-index: 100;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  color: #303133;
  font-weight: 500;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.user-dropdown:hover {
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.home-content {
  width: 100%;
  max-width: 700px;
}

.hero-section {
  text-align: center;
  margin-bottom: 40px;
  color: white;
}

.logo {
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.title {
  font-size: 36px;
  font-weight: bold;
  margin: 0 0 16px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
}

.subtitle {
  font-size: 18px;
  margin: 0;
  opacity: 0.95;
}

.upload-card {
  margin-bottom: 30px;
  border-radius: 12px;
  overflow: hidden;
}

.upload-card :deep(.el-card__body) {
  padding: 30px;
}

.features {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  color: #303133;
  font-weight: 500;
  transition: all 0.3s;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;
}

.feature-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.tips {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.tips :deep(.el-alert) {
  background: transparent;
  border: none;
  padding: 0;
}

.tips ul {
  margin: 10px 0 0 0;
  padding-left: 20px;
}

.tips li {
  line-height: 2;
  color: #606266;
}

@media (max-width: 768px) {
  .title {
    font-size: 28px;
  }

  .subtitle {
    font-size: 16px;
  }

  .features {
    grid-template-columns: repeat(2, 1fr);
  }

  .upload-card :deep(.el-card__body) {
    padding: 20px;
  }
}
</style>
