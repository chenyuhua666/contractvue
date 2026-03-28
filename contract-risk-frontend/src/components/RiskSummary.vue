<template>
  <el-card class="risk-summary" shadow="hover">
    <template #header>
      <div class="header">
        <el-icon><data-analysis /></el-icon>
        <span>风险统计</span>
      </div>
    </template>

    <div v-if="isEmpty" class="empty-summary">
      <el-empty description="暂无风险数据" :image-size="100" />
    </div>

    <div v-else>
      <div class="summary-content">
        <div class="stat-item high">
          <div class="stat-icon">
            <el-icon><warning-filled /></el-icon>
          </div>
          <div class="stat-value">{{ summary.highRisk || 0 }}</div>
          <div class="stat-label">高风险</div>
        </div>

        <div class="stat-item medium">
          <div class="stat-icon">
            <el-icon><warning /></el-icon>
          </div>
          <div class="stat-value">{{ summary.mediumRisk || 0 }}</div>
          <div class="stat-label">中风险</div>
        </div>

        <div class="stat-item low">
          <div class="stat-icon">
            <el-icon><info-filled /></el-icon>
          </div>
          <div class="stat-value">{{ summary.lowRisk || 0 }}</div>
          <div class="stat-label">低风险</div>
        </div>

        <div class="stat-item total">
          <div class="stat-icon">
            <el-icon><data-line /></el-icon>
          </div>
          <div class="stat-value">{{ summary.totalRisk || 0 }}</div>
          <div class="stat-label">总计</div>
        </div>
      </div>

      <el-divider />

      <div class="summary-info">
        <div class="info-row">
          <span class="info-label">合同名称：</span>
          <span class="info-value">{{ summary.contractName || '未命名' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">分析时间：</span>
          <span class="info-value">{{ summary.analyzeTime || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">整体评估：</span>
          <el-tag :type="getOverallType(summary.overallRisk)" size="large" effect="dark">
            {{ summary.overallRisk || '未知' }}
          </el-tag>
        </div>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DataAnalysis, WarningFilled, Warning, InfoFilled, DataLine } from '@element-plus/icons-vue'

interface Summary {
  highRisk?: number
  mediumRisk?: number
  lowRisk?: number
  totalRisk?: number
  contractName?: string
  analyzeTime?: string
  overallRisk?: string
}

const props = defineProps<{
  summary: Summary
}>()

const isEmpty = computed(() => {
  return !props.summary || Object.keys(props.summary).length === 0
})

const getOverallType = (risk: string | undefined) => {
  const typeMap: Record<string, any> = {
    '高风险': 'danger',
    '中风险': 'warning',
    '低风险': 'success',
    '无风险': 'info'
  }
  return typeMap[risk || ''] || 'info'
}
</script>

<style scoped>
.risk-summary {
  margin-bottom: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
}

.empty-summary {
  padding: 40px 0;
}

.summary-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 24px;
  border-radius: 12px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}

.stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: currentColor;
}

.stat-item:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-item.high {
  background: linear-gradient(135deg, #fff5f5 0%, #fee 100%);
  border: 2px solid #f56c6c;
  color: #f56c6c;
}

.stat-item.medium {
  background: linear-gradient(135deg, #fffbf0 0%, #fef5e7 100%);
  border: 2px solid #e6a23c;
  color: #e6a23c;
}

.stat-item.low {
  background: linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%);
  border: 2px solid #409eff;
  color: #409eff;
}

.stat-item.total {
  background: linear-gradient(135deg, #f9f9f9 0%, #f0f0f0 100%);
  border: 2px solid #909399;
  color: #909399;
}

.stat-icon {
  font-size: 32px;
  margin-bottom: 12px;
  opacity: 0.8;
}

.stat-value {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 8px;
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
  font-weight: 500;
}

.summary-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  transition: background 0.3s;
}

.info-row:hover {
  background: #ebeef5;
}

.info-label {
  font-weight: 600;
  color: #606266;
  min-width: 100px;
}

.info-value {
  color: #303133;
  flex: 1;
}

@media (max-width: 768px) {
  .summary-content {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .stat-item {
    padding: 16px;
  }

  .stat-value {
    font-size: 28px;
  }

  .stat-icon {
    font-size: 24px;
  }
}
</style>
