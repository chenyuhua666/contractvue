# 前后端联调说明

## 数据流程

```
用户上传文件
    ↓
POST /api/contract/upload
    ↓
返回 Contract {id, name, filePath, ...}
    ↓
POST /api/review/start {contractId, mode: "mock"}
    ↓
返回 ReviewTask {id, status: 0/1, ...}
    ↓
轮询 GET /api/review/{taskId}/status (每 2 秒)
    ↓
status = 2 (完成)
    ↓
GET /api/review/{taskId}/result
    ↓
返回 List<RiskResult>
    ↓
前端展示风险列表
```

## 后端实体与前端类型对应

### Contract（合同）

**后端实体** (`com.contractrisk.agent.module.contract.entity.Contract`):
```java
@TableName("t_contract")
public class Contract {
    private Long id;
    private Long userId;
    private String name;           // 合同名称
    private String filePath;       // 文件存储路径
    private String fileType;       // pdf / docx / image
    private String rawText;        // 解析后的原始文本
    private Integer parseStatus;   // 0-待解析 1-解析中 2-完成 3-失败
    private LocalDateTime createdAt;
    private Integer deleted;
}
```

**前端类型** (`src/api/contract.ts`):
```typescript
export interface Contract {
  id: number
  userId: number
  name: string
  filePath: string
  fileType: string
  rawText?: string
  parseStatus: number
  createdAt: string
  deleted?: number
}
```

### ReviewTask（审查任务）

**后端实体** (`com.contractrisk.agent.module.review.entity.ReviewTask`):
```java
@TableName("t_review_task")
public class ReviewTask {
    private Long id;
    private Long contractId;
    private Long userId;
    private Integer status;        // 0-待执行 1-执行中 2-完成 3-失败
    private String mode;           // mock / rag / llm
    private String errorMsg;
    private LocalDateTime createdAt;
    private LocalDateTime finishedAt;
    private Integer deleted;
}
```

**前端类型**:
```typescript
export interface ReviewTask {
  id: number
  contractId: number
  userId: number
  status: number
  mode: string
  errorMsg?: string
  createdAt: string
  finishedAt?: string
  deleted?: number
}
```

### RiskResult（风险结果）

**后端实体** (`com.contractrisk.agent.module.risk.entity.RiskResult`):
```java
@TableName("t_risk_result")
public class RiskResult {
    private Long id;
    private Long taskId;
    private Long contractId;
    private String clauseText;         // 原始条款文本
    private String riskType;           // 风险类型
    private String riskLevel;          // 红色 / 黄色 / 绿色
    private String analysis;           // 风险分析说明
    private String impactOnPartyA;
    private String impactOnPartyB;
    private String revisionSuggestion;
    private String replacementText;
    private String clausePosition;     // JSON，用于前端高亮
    private LocalDateTime createdAt;
}
```

**前端类型**:
```typescript
export interface RiskResult {
  id: number
  taskId: number
  contractId: number
  clauseText: string
  riskType: string
  riskLevel: string
  analysis: string
  impactOnPartyA?: string
  impactOnPartyB?: string
  revisionSuggestion?: string
  replacementText?: string
  clausePosition?: string
  createdAt: string
}
```

## API 接口详细说明

### 1. 上传合同

**请求**:
```
POST /api/contract/upload
Content-Type: multipart/form-data

file: <File>
```

**响应**:
```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "id": 1,
    "userId": 1,
    "name": "技术服务合同.pdf",
    "filePath": "/uploads/2024/01/xxx.pdf",
    "fileType": "pdf",
    "parseStatus": 0,
    "createdAt": "2024-01-01T10:00:00"
  }
}
```

### 2. 发起审查

**请求**:
```
POST /api/review/start
Content-Type: application/json

{
  "contractId": 1,
  "mode": "mock"
}
```

**响应**:
```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "id": 1,
    "contractId": 1,
    "userId": 1,
    "status": 0,
    "mode": "mock",
    "createdAt": "2024-01-01T10:00:00"
  }
}
```

### 3. 查询任务状态（轮询）

**请求**:
```
GET /api/review/1/status
```

**响应**:
```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "id": 1,
    "contractId": 1,
    "userId": 1,
    "status": 2,
    "mode": "mock",
    "createdAt": "2024-01-01T10:00:00",
    "finishedAt": "2024-01-01T10:01:00"
  }
}
```

### 4. 获取审查结果

**请求**:
```
GET /api/review/1/result
GET /api/review/1/result?riskLevel=红色
```

**响应**:
```json
{
  "code": 200,
  "msg": "ok",
  "data": [
    {
      "id": 1,
      "taskId": 1,
      "contractId": 1,
      "clauseText": "乙方违约需支付合同总额30%违约金",
      "riskType": "违约责任不对等",
      "riskLevel": "红色",
      "analysis": "双方违约责任严重不对等，对乙方极为不利",
      "revisionSuggestion": "建议修改为双方违约责任对等",
      "createdAt": "2024-01-01T10:01:00"
    }
  ]
}
```

## 前端数据转换

前端在 `Result.vue` 中将后端的 `RiskResult[]` 转换为展示格式：

```typescript
// 风险等级映射
红色 → 高风险
黄色 → 中风险
绿色 → 低风险

// 数据结构转换
{
  summary: {
    highRisk: 红色数量,
    mediumRisk: 黄色数量,
    lowRisk: 绿色数量,
    totalRisk: 总数量,
    contractName: contract.name,
    analyzeTime: 当前时间,
    overallRisk: 根据风险等级计算
  },
  risks: RiskResult[] 转换为展示格式,
  suggestions: 从 RiskResult[] 提取建议
}
```

## 注意事项

1. **字段名差异**:
   - 后端 Result 使用 `msg`，不是 `message`
   - 合同名称字段是 `name`，不是 `fileName`

2. **状态值**:
   - ReviewTask.status: 0-待执行 1-执行中 2-完成 3-失败
   - Contract.parseStatus: 0-待解析 1-解析中 2-完成 3-失败

3. **轮询机制**:
   - 前端每 2 秒轮询一次任务状态
   - 任务完成（status=2）后停止轮询并获取结果
   - 任务失败（status=3）后停止轮询并显示错误

4. **用户认证**:
   - 后端使用 `UserContext.getUserId()` 获取当前用户
   - 前端需要确保用户已登录（如果有认证模块）

5. **文件上传限制**:
   - 前端限制：10MB
   - Nginx 限制：10MB (`client_max_body_size`)
   - 后端需要配置相应的文件大小限制
