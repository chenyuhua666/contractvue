# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

合同审查风险 Agent 前端 - AI-powered contract risk identification system frontend.

**Important**: The actual Vue project is in the `contract-risk-frontend/` subdirectory, not the root.

## Development Commands

All commands should be run from the `contract-risk-frontend/` directory:

```bash
cd contract-risk-frontend
npm run dev      # Start development server
npm run build    # Build for production (runs vue-tsc type check + vite build)
npm run preview  # Preview production build locally
```

## Tech Stack

- Vue 3.5+ with TypeScript
- Vite 8+ (build tool)
- Composition API with `<script setup>` syntax
- Planned: Element Plus, Pinia, Axios, Vue Router (not yet installed)

## Project Structure

```
contract-risk-frontend/
├── src/
│   ├── api/          # API 调用模块（统一管理所有后端接口）
│   ├── views/        # 页面组件
│   ├── components/   # 可复用组件
│   ├── stores/       # Pinia 状态管理（如需要）
│   ├── router/       # Vue Router 配置（如需要）
│   ├── App.vue       # 根组件
│   └── main.ts       # 入口文件
```

## Backend API Integration

### 认证模块 (`/api/auth`)
- `POST /api/auth/login` - 用户登录，body: {username, password}, 返回 LoginResponse
- `POST /api/auth/register` - 用户注册，body: {username, password}, 返回 LoginResponse

### 合同模块 (`/api/contract`)
- `POST /api/contract/upload` - 上传合同文件，返回 Contract 对象
- `GET /api/contract/list?pageNum=1&pageSize=10` - 获取合同列表（分页）
- `GET /api/contract/{id}` - 获取合同详情
- `DELETE /api/contract/{id}` - 删除合同

### 审查模块 (`/api/review`)
- `POST /api/review/start` - 发起审查，body: {contractId, mode}, 返回 ReviewTask
- `GET /api/review/{taskId}/status` - 查询任务状态（轮询），返回 ReviewTask
- `GET /api/review/{taskId}/result?riskLevel=` - 获取审查结果列表，返回 List<RiskResult>

### 数据结构

**LoginRequest（登录请求）**:
```typescript
{
  username: string
  password: string
}
```

**LoginResponse（登录响应）**:
```typescript
{
  token: string
  userId: number
  username: string
  role: string  // ADMIN / USER
}
```

**Contract（合同）**:
```typescript
{
  id: number
  userId: number
  name: string
  filePath: string
  fileType: string  // pdf / docx / image
  rawText?: string
  parseStatus: number  // 0-待解析 1-解析中 2-完成 3-失败
  createdAt: string
}
```

**ReviewTask（审查任务）**:
```typescript
{
  id: number
  contractId: number
  userId: number
  status: number  // 0-待执行 1-执行中 2-完成 3-失败
  mode: string    // mock / rag / llm
  errorMsg?: string
  createdAt: string
  finishedAt?: string
}
```

**RiskResult（风险结果）**:
```typescript
{
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
```

### 后端统一返回格式
```json
{
  "code": 200,
  "msg": "ok",
  "data": { ... }
}
```

### 工作流程
1. 用户登录/注册 → 获取 token 并存储到 localStorage
2. 所有 API 请求自动携带 token（Authorization: Bearer {token}）
3. 上传合同文件 → 获取 Contract 对象
4. 发起审查任务 → 获取 ReviewTask 对象（包含 taskId）
5. 轮询任务状态 → 检查 ReviewTask.status（每 2 秒查询一次）
6. 任务完成后 → 获取 List<RiskResult> 风险结果列表

### 路由守卫
- 未登录用户访问需要认证的页面 → 自动跳转到登录页
- 已登录用户访问登录页 → 自动跳转到首页
- Token 存储在 localStorage 中，刷新页面保持登录状态

## Core Features

1. 文件上传（支持 PDF/Word/Image）
2. 风险条款展示
3. 风险等级标注
4. AI 修改建议
5. 报告下载

## Code Guidelines

1. **模块化**: 所有代码必须模块化，按功能拆分
2. **API 管理**: 所有 API 调用统一放在 `src/api/` 目录
3. **页面组件**: 所有页面放在 `src/views/`
4. **可复用组件**: 所有组件放在 `src/components/`
5. **Composition API**: 使用 Composition API + `<script setup>` 语法
6. **UI 框架**: 使用 Element Plus 组件库
7. **样式风格**: 简洁现代的后台管理系统风格

## Working Style

- 直接修改文件，不要过度解释
- 如果涉及多个文件，一次性完成所有修改
- 保持代码简洁，避免过度抽象