# 部署说明

## 前端构建

```bash
cd contract-risk-frontend
npm install
npm run build
```

构建产物在 `contract-risk-frontend/dist/` 目录。

## 本地开发联调

### 1. 启动后端服务

确保后端服务运行在 `http://localhost:8080`

### 2. 启动前端开发服务器

```bash
cd contract-risk-frontend
npm run dev
```

前端会运行在 `http://localhost:5173`，API 请求会自动代理到后端 `http://localhost:8080`

### 3. 测试流程

1. 访问 `http://localhost:5173`
2. 上传合同文件（PDF/Word/图片）
3. 系统会自动：
   - 上传文件到后端
   - 发起审查任务（mock 模式）
   - 跳转到结果页面
   - 轮询任务状态（每 2 秒）
   - 任务完成后展示风险结果

## Nginx 部署

### 方式一：直接使用 Nginx

1. 将 `contract-risk-frontend/dist/` 目录复制到 `/usr/share/nginx/html`
2. 将 `nginx.conf` 复制到 `/etc/nginx/conf.d/default.conf`
3. 修改 `nginx.conf` 中的 `proxy_pass` 地址为实际后端地址
4. 重启 Nginx：`nginx -s reload`

### 方式二：使用 Docker Compose

1. 构建前端：`cd contract-risk-frontend && npm run build`
2. 修改 `docker-compose.yml` 中的后端镜像地址
3. 启动服务：`docker-compose up -d`

## Nginx 配置说明

- **前端路由**：使用 `try_files` 支持 Vue Router 的 history 模式
- **API 代理**：`/api/` 路径代理到后端服务
- **文件上传**：限制最大 10MB（`client_max_body_size`）
- **静态资源缓存**：JS/CSS/图片等缓存 1 年
- **Gzip 压缩**：启用文本资源压缩

## 后端配置要求

后端需要：
1. 监听 8080 端口（或修改 vite.config.ts 和 nginx.conf 中的地址）
2. 配置 CORS（如果前后端不在同一域名）
3. 返回统一的 Result<T> 格式：
   ```json
   {
     "code": 200,
     "msg": "ok",
     "data": { ... }
   }
   ```

## 数据结构对应关系

### Contract（合同）
- 前端字段：id, userId, name, filePath, fileType, rawText, parseStatus, createdAt
- 后端实体：com.contractrisk.agent.module.contract.entity.Contract

### ReviewTask（审查任务）
- 前端字段：id, contractId, userId, status, mode, errorMsg, createdAt, finishedAt
- 后端实体：com.contractrisk.agent.module.review.entity.ReviewTask
- 状态值：0-待执行 1-执行中 2-完成 3-失败

### RiskResult（风险结果）
- 前端字段：id, taskId, contractId, clauseText, riskType, riskLevel, analysis, etc.
- 后端实体：com.contractrisk.agent.module.risk.entity.RiskResult
- 风险等级：红色（高风险）/ 黄色（中风险）/ 绿色（低风险）

## 验证部署

1. 访问前端页面
2. 上传测试文件
3. 检查浏览器 Network 面板：
   - `POST /api/contract/upload` - 上传合同
   - `POST /api/review/start` - 发起审查
   - `GET /api/review/{taskId}/status` - 轮询状态
   - `GET /api/review/{taskId}/result` - 获取结果
4. 确认结果页面正常展示风险列表
