# 用户认证系统说明

## 功能概述

前端实现了完整的用户认证系统，包括：
- 登录页面
- 注册页面
- Token 管理
- 路由守卫
- 用户信息展示
- 退出登录

## 后端接口

### 1. 登录接口

**请求**:
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "testuser",
  "password": "123456"
}
```

**响应**:
```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": 1,
    "username": "testuser",
    "role": "USER"
  }
}
```

### 2. 注册接口

**请求**:
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "123456"
}
```

**响应**:
```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": 2,
    "username": "newuser",
    "role": "USER"
  }
}
```

## 前端实现

### 1. Token 存储

Token 和用户信息存储在 `localStorage` 中：
- `contract_risk_token` - JWT Token
- `contract_risk_user` - 用户信息（JSON 字符串）

### 2. 请求拦截器

所有 API 请求自动携带 Token：

```typescript
// src/api/contract.ts
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('contract_risk_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### 3. 路由守卫

未登录用户无法访问需要认证的页面：

```typescript
// src/router/index.ts
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !userStore.isLoggedIn) {
    next('/login')
  } else if (to.path === '/login' && userStore.isLoggedIn) {
    next('/')
  } else {
    next()
  }
})
```

### 4. 用户状态管理

使用 Pinia Store 管理用户状态：

```typescript
// src/stores/user.ts
export const useUserStore = defineStore('user', () => {
  const token = ref<string>('')
  const userInfo = ref<LoginResponse | null>(null)
  const isLoggedIn = computed(() => !!token.value)

  function login(loginResponse: LoginResponse) {
    setToken(loginResponse.token)
    setUserInfo(loginResponse)
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_INFO_KEY)
  }

  return { token, userInfo, isLoggedIn, login, logout }
})
```

## 页面说明

### 1. 登录页面 (`/login`)

- 支持登录和注册两个 Tab
- 表单验证：
  - 用户名：3-20 个字符
  - 密码：至少 6 位
  - 注册时需要确认密码
- 登录/注册成功后自动跳转到首页

### 2. 首页 (`/`)

- 右上角显示用户信息下拉菜单
- 显示用户名和角色（管理员/用户）
- 点击"退出登录"弹出确认框

### 3. 结果页面 (`/result`)

- 头部右侧显示用户信息
- 支持退出登录

## 用户角色

后端支持两种角色：
- `ADMIN` - 管理员
- `USER` - 普通用户

前端会在用户信息下拉菜单中显示角色标签。

## 安全性

1. **Token 过期处理**：
   - 后端应该实现 Token 过期机制
   - 前端可以在响应拦截器中处理 401 错误，自动跳转到登录页

2. **密码安全**：
   - 前端限制密码最少 6 位
   - 后端应该对密码进行加密存储（BCrypt）

3. **XSS 防护**：
   - Vue 自动转义 HTML
   - 不要使用 `v-html` 渲染用户输入

4. **CSRF 防护**：
   - 使用 JWT Token 而不是 Cookie
   - 后端应该验证 Token 的有效性

## 测试流程

1. **注册新用户**：
   - 访问 `http://localhost:5173/login`
   - 切换到"注册" Tab
   - 输入用户名和密码
   - 点击"注册"按钮

2. **登录**：
   - 访问 `http://localhost:5173/login`
   - 输入用户名和密码
   - 点击"登录"按钮

3. **验证认证**：
   - 登录成功后自动跳转到首页
   - 右上角显示用户名
   - 尝试直接访问 `/` 或 `/result`，未登录会跳转到登录页

4. **退出登录**：
   - 点击右上角用户名下拉菜单
   - 点击"退出登录"
   - 确认后跳转到登录页

5. **Token 持久化**：
   - 登录后刷新页面
   - 用户仍然保持登录状态
   - 打开浏览器开发者工具 → Application → Local Storage
   - 查看 `contract_risk_token` 和 `contract_risk_user`

## 后端配置要求

1. **JWT Token 生成**：
   - 使用 JWT 生成 Token
   - Token 应该包含 userId, username, role 等信息
   - 设置合理的过期时间（如 7 天）

2. **Token 验证**：
   - 从请求头 `Authorization: Bearer {token}` 中提取 Token
   - 验证 Token 的有效性
   - 解析 Token 获取用户信息
   - 将用户信息存入 `UserContext`

3. **密码加密**：
   - 使用 BCrypt 加密密码
   - 注册时加密存储
   - 登录时验证密码

## 常见问题

### 1. 登录后刷新页面又跳转到登录页？

检查：
- Token 是否正确存储到 localStorage
- 路由守卫是否正确读取 Token
- 浏览器是否禁用了 localStorage

### 2. API 请求返回 401 未授权？

检查：
- Token 是否正确携带在请求头中
- Token 是否过期
- 后端是否正确验证 Token

### 3. 注册/登录失败？

检查：
- 用户名是否已存在（注册时）
- 密码是否正确（登录时）
- 后端服务是否正常运行
- 网络请求是否成功

### 4. 退出登录后 Token 仍然存在？

检查：
- `logout()` 方法是否正确清除 localStorage
- 是否调用了 `contractStore.reset()` 清除合同数据
