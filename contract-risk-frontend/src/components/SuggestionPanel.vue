<template>
  <el-card class="suggestion-panel" shadow="hover">
    <template #header>
      <div class="header">
        <el-icon><magic-stick /></el-icon>
        <span>AI 综合建议</span>
      </div>
    </template>

    <div v-if="suggestions.length" class="suggestions-content">
      <div class="suggestion-stats">
        <el-tag type="danger" size="large">{{ importantCount }} 条重要</el-tag>
        <el-tag type="warning" size="large">{{ suggestionCount }} 条建议</el-tag>
        <el-tag type="info" size="large">{{ tipCount }} 条提示</el-tag>
      </div>

      <el-timeline>
        <el-timeline-item
          v-for="(suggestion, index) in suggestions"
          :key="index"
          :icon="getIcon(suggestion.type)"
          :type="getType(suggestion.type)"
          :size="'large'"
        >
          <div class="suggestion-item">
            <div class="suggestion-title">
              <el-tag :type="getType(suggestion.type)" size="small">
                {{ suggestion.type }}
              </el-tag>
              <span>{{ suggestion.title }}</span>
            </div>
            <div class="suggestion-content">
              {{ suggestion.content }}
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>

      <el-divider />

      <div class="overall-suggestion">
        <el-alert
          title="总体建议"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>{{ overallSuggestion }}</p>
          </template>
        </el-alert>
      </div>
    </div>

    <el-empty v-else description="暂无建议" :image-size="100">
      <template #image>
        <el-icon :size="100" color="#67c23a"><circle-check /></el-icon>
      </template>
    </el-empty>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MagicStick, Check, Warning, InfoFilled, CircleCheck } from '@element-plus/icons-vue'
import { shallowRef } from 'vue'

interface Suggestion {
  type: string
  title: string
  content: string
}

const props = defineProps<{
  suggestions: Suggestion[]
}>()

const importantCount = computed(() => props.suggestions.filter(s => s.type === '重要').length)
const suggestionCount = computed(() => props.suggestions.filter(s => s.type === '建议').length)
const tipCount = computed(() => props.suggestions.filter(s => s.type === '提示').length)

const overallSuggestion = computed(() => {
  const highRiskCount = props.suggestions.filter(s => s.type === '重要').length
  if (highRiskCount > 2) {
    return '该合同存在多处重要风险点，建议在签署前咨询专业法律顾问，并与对方协商修改相关条款。'
  } else if (highRiskCount > 0) {
    return '该合同存在部分风险点，建议重点关注标注的重要条款，必要时进行修改。'
  } else {
    return '该合同整体风险较低，但仍建议仔细阅读所有条款，确保符合实际需求。'
  }
})

const getType = (type: string) => {
  const typeMap: Record<string, any> = {
    '重要': 'danger',
    '建议': 'warning',
    '提示': 'info'
  }
  return typeMap[type] || 'info'
}

const getIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    '重要': shallowRef(Warning),
    '建议': shallowRef(Check),
    '提示': shallowRef(InfoFilled)
  }
  return iconMap[type] || shallowRef(InfoFilled)
}
</script>

<style scoped>
.suggestion-panel {
  margin-bottom: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
}

.suggestions-content {
  padding: 10px 0;
}

.suggestion-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  justify-content: center;
}

.suggestion-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 10px;
}

.suggestion-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  font-weight: bold;
  color: #303133;
  font-size: 16px;
}

.suggestion-content {
  line-height: 1.8;
  color: #606266;
  padding-left: 10px;
}

.overall-suggestion {
  margin-top: 20px;
}

.overall-suggestion p {
  line-height: 1.8;
  margin: 0;
}

:deep(.el-timeline-item__wrapper) {
  padding-left: 20px;
}
</style>
