#  用户管理系统 - 部署指南

##  概述

你已经有两个用户在 Supabase Dashboard 中了（从截图看到）。现在需要：
1. 将其中一个设为管理员
2. 部署 Edge Function
3. 更新数据库 schema

---

##  部署步骤

### 步骤 1：设置管理员账户

在 **Supabase SQL Editor** 中执行以下 SQL，将你当前的用户设为管理员：

```sql
-- 查看当前所有用户的 ID
SELECT id, email, display_name FROM auth.users;

-- 将你的用户设为管理员（替换为你的用户ID）
UPDATE public.profiles 
SET is_admin = true 
WHERE id = '你的用户ID';  -- 从上面的查询结果中找到你的用户ID

-- 验证
SELECT id, email, display_name, is_admin FROM public.profiles WHERE is_admin = true;
```

**如何找到你的用户ID：**
1. 打开 Supabase Dashboard → Authentication → Users
2. 点击你的用户邮箱
3. 复制 UID（类似：`2cac624a-40e0-4ba7-a636-d08b0f40f25e`）

---

### 步骤 2：更新数据库 Schema

在 **Supabase SQL Editor** 中执行：

```sql
-- 添加 is_admin 字段到 profiles 表
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 为现有用户设置默认值
UPDATE public.profiles SET is_admin = false WHERE is_admin IS NULL;
```

---

### 步骤 3：部署 Edge Function

在项目根目录执行：

```bash
cd /Users/cinc/Desktop/MyCode/Cook/our-space

# 登录 Supabase CLI（如果还没登录）
npx supabase login

# 链接项目
npx supabase link --project-ref <你的项目ID>

# 部署 Edge Function
npx supabase functions deploy manage-users
```

**获取项目ID：**
- 在 Supabase Dashboard URL 中找到：`https://supabase.com/dashboard/project/<项目ID>`

---

### 步骤 4：配置环境变量

Edge Function 需要 `SUPABASE_SERVICE_ROLE_KEY`，它会自动从 Supabase 项目中读取，无需额外配置。

---

### 步骤 5：测试功能

1. 用管理员账户登录应用
2. 进入 **设置页面** → **用户管理**
3. 点击 **"管理用户"** 按钮
4. 应该能看到所有用户列表
5. 尝试添加/删除用户

---

##  重要安全说明

### ✅ 为什么使用 Edge Function？

**之前的问题：**
```typescript
// ❌ 不安全：客户端直接使用 Admin API
await supabase.auth.admin.createUser({...})
```
- 需要暴露 Service Role Key（超级权限）
- 任何用户都可以调用
- 严重安全风险

**现在的方案：**
```typescript
// ✅ 安全：通过 Edge Function
fetch('/functions/v1/manage-users', {
  headers: { Authorization: `Bearer ${session.access_token}` }
})
```
- Service Role Key 只在服务端
- 验证用户身份和权限
- 只有管理员可以操作

---

### 🔒 权限控制流程

```
用户点击"管理用户"
    ↓
前端发送请求 + JWT Token
    ↓
Edge Function 接收请求
    ↓
验证 JWT Token 是否有效
    ↓
查询 profiles.is_admin 是否为 true
    ↓
✓ 是管理员 → 执行操作
 不是管理员 → 返回 403 Forbidden
```

---

## ️ 故障排查

### 问题 1：点击"管理用户"提示"只有管理员可以查看"

**原因：** 当前登录用户不是管理员

**解决：**
```sql
-- 检查当前用户是否是管理员
SELECT is_admin FROM public.profiles 
WHERE id = auth.uid();

-- 如果不是，设置为管理员
UPDATE public.profiles SET is_admin = true WHERE id = auth.uid();
```

### 问题 2：Edge Function 部署失败

**可能原因：**
- Supabase CLI 未安装
- 未登录或未链接项目

**解决：**
```bash
# 安装 CLI
npm install -g supabase

# 登录
supabase login

# 链接项目
supabase link --project-ref <项目ID>

# 重新部署
supabase functions deploy manage-users
```

### 问题 3：CORS 错误

**原因：** Edge Function 的 CORS 配置问题

**解决：** Edge Function 代码已包含正确的 CORS headers，检查是否正确部署。

---

## 📊 架构对比

| 特性 | 之前（不安全） | 现在（安全） |
|------|--------------|-------------|
| 权限控制 | ❌ 无 | ✅ JWT + is_admin |
| Service Key | ❌ 暴露在客户端 | ✅ 只在服务端 |
| 安全性 | ⚠️ 高风险 | ✅ 生产级安全 |
| 可扩展性 |  难以扩展 | ✅ 易于添加新功能 |

---

## 🎯 后续优化建议

### 1. 添加用户编辑功能
目前支持：创建、删除、列表  
建议添加：编辑邮箱、重置密码

### 2. 添加审计日志
记录所有用户管理操作：
```sql
CREATE TABLE user_audit_logs (
  id bigserial PRIMARY KEY,
  admin_id uuid REFERENCES auth.users(id),
  action text,
  target_user_id uuid,
  created_at timestamptz DEFAULT now()
);
```

### 3. 批量操作
支持批量导入/导出用户

### 4. 角色系统
除了 `is_admin`，可以添加更多角色：
- `is_moderator` - 版主
- `is_editor` - 编辑者

---

## 💡 最佳实践

1. **始终使用 Edge Function** 处理敏感操作
2. **定期审计** 管理员权限
3. **启用双重认证** 保护管理员账户
4. **备份用户数据** 定期导出

---

**完成时间估计：** 10-15分钟  
**难度等级：** ⭐⭐☆☆☆（简单）

如有问题，请检查 Supabase Dashboard 的 Logs 页面查看 Edge Function 的执行日志。
