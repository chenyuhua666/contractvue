<template>
  <el-card class="risk-list" shadow="hover">
    <template #header>
      <div class="header">
        <el-icon><warning /></el-icon>
        <span>风险条款列表</span>
        <el-tag v-if="risks.length" type="info" size="small" class="count-tag">
          共 {{ risks.length }} 条
        </el-tag>
      </div>
    </template>

    <el-empty
      v-if="!risks.length"
      description="未发现风险条款"
      :image-size="120"
    >
      <template #image>
        <el-icon :size="120" color="#909399"><circle-check /></el-icon>
      </template>
      <template #description>
        <p style="color: #67c23a; font-size: 16px; font-weight: bold;">恭喜！未发现明显风险</p>
      </template>
    </el-empty>

    <div v-else class="risk-items">
      <el-card
        v-for="(risk, index) in risks"
        :key="index"
        class="risk-item"
        shadow="hover"
      >
        <div class="risk-header">
          <div class="risk-number">#{{ index + 1 }}</div>
          <el-tag :type="getRiskType(risk.level)" size="large">
            {{ risk.level }}
          </el-tag>
          <span class="risk-title">{{ risk.title }}</span>
          <el-button
            v-if="hasDetail(risk)"
            size="small"
            :icon="isExpanded(index) ? 'DArrowUp' : 'DArrowDown'"
            @click="toggleExpand(index)"
            link
          >
            {{ isExpanded(index) ? '收起详情' : '展开详情' }}
          </el-button>
        </div>

        <el-divider />

        <div class="risk-content">
          <div class="content-section">
            <div class="section-label">
              <el-icon><document /></el-icon>
              原文内容
            </div>
            <div class="section-text">{{ risk.content }}</div>
          </div>

          <div class="content-section">
            <div class="section-label">
              <el-icon><info-filled /></el-icon>
              风险说明
            </div>
            <div class="section-text risk-description">{{ risk.description }}</div>
          </div>

          <div class="content-section">
            <div class="section-label">
              <el-icon><edit /></el-icon>
              修改建议
            </div>
            <div class="section-text suggestion">{{ risk.suggestion }}</div>
          </div>

          <!-- 展开的详情 -->
          <template v-if="isExpanded(index)">
            <div v-if="risk.clausePosition" class="content-section detail-section">
              <div class="section-label">
                <el-icon><Position /></el-icon>
                条款位置
              </div>
              <div class="section-text">{{ risk.clausePosition }}</div>
            </div>

            <div v-if="risk.impactOnPartyA" class="content-section detail-section impact-a">
              <div class="section-label">
                <el-icon><User /></el-icon>
                对甲方影响
              </div>
              <div class="section-text">{{ risk.impactOnPartyA }}</div>
            </div>

            <div v-if="risk.impactOnPartyB" class="content-section detail-section impact-b">
              <div class="section-label">
                <el-icon><User /></el-icon>
                对乙方影响
              </div>
              <div class="section-text">{{ risk.impactOnPartyB }}</div>
            </div>

            <div v-if="risk.replacementText" class="content-section detail-section replacement">
              <div class="section-label">
                <el-icon><DocumentCopy /></el-icon>
                建议替换文本
              </div>
              <div class="section-text replacement-text">{{ risk.replacementText }}</div>
            </div>
          </template>
        </div>
      </el-card>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Warning, Document, InfoFilled, Edit, CircleCheck, Position, User, DocumentCopy } from '@element-plus/icons-vue'

export interface Risk {
  level: string
  title: string
  content: string
  description: string
  suggestion: string
  clausePosition?: string
  impactOnPartyA?: string
  impactOnPartyB?: string
  replacementText?: string
}

const props = defineProps<{
  risks: Risk[]
}>()

// 使用 Set 追踪展开的索引
const expandedSet = ref(new Set<number>())

const hasDetail = (risk: Risk): boolean => {
  return !!(risk.clausePosition || risk.impactOnPartyA || risk.impactOnPartyB || risk.replacementText)
}

const isExpanded = (index: number): boolean => {
  return expandedSet.value.has(index)
}

const getRiskType = (level: string) => {
  const typeMap: Record<string, any> = {
    '高风险': 'danger',
    '中风险': 'warning',
    '低风险': 'info'
  }
  return typeMap[level] || 'info'
}

const toggleExpand = (index: number) => {
  if (expandedSet.value.has(index)) {
    expandedSet.value.delete(index)
  } else {
    expandedSet.value.add(index)
  }
}
</script>

<style scoped>
.risk-list {
  margin-bottom: 20px;
}

.header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: bold;
}

.count-tag {
  margin-left: auto;
}

.risk-items {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.risk-item {
  transition: all 0.3s;
  border-left: 4px solid #409eff;
}

.risk-item:hover {
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.risk-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.risk-number {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409eff;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
}

.risk-title {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  flex: 1;
}

.risk-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.content-section {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 6px;
}

.detail-section {
  background: #ecf5ff;
  border-left: 3px solid #409eff;
}

.impact-a {
  background: #fef0f0;
  border-left-color: #f56c6c;
}

.impact-b {
  background: #f0f9eb;
  border-left-color: #67c23a;
}

.replacement {
  background: #fdf6ec;
  border-left-color: #e6a23c;
}

.section-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: bold;
  color: #606266;
  margin-bottom: 8px;
  font-size: 14px;
}

.section-text {
  line-height: 1.8;
  color: #606266;
  padding-left: 22px;
}

.risk-description {
  color: #f56c6c;
  font-weight: 500;
}

.suggestion {
  color: #67c23a;
  font-weight: 500;
}

.replacement-text {
  color: #e6a23c;
  font-family: monospace;
  white-space: pre-wrap;
}
</style>
