# 🏡 Our Space - 我们的专属空间

一个温馨、浪漫的共享空间应用，为情侣打造专属的数字回忆家园。

## ✨ 功能特性

### 👥 用户管理
- **多用户协作**：所有用户共享同一套数据，共同维护空间内容
- **管理员系统**：支持管理员角色，可管理用户（增删改查）
- **安全认证**：基于 Supabase Auth 的用户认证系统

###  个性化设置
- **18种精美主题**：春日暖阳、海洋之心、落日余晖等预设主题
- **自定义背景**：上传个人照片作为背景，所有用户共享
- **轮换播放**：支持多张背景自动轮换（每30秒）
- **纪念日计数**：记录在一起的天数，见证美好时光

###  状态动态
- **发布心情**：分享当下的心情和状态
- **Emoji映射**：根据标签自动显示对应图标
- **成功提示**：优雅的Toast弹窗反馈

### 📝 日志日记
- **记录生活**：写下日常点滴和美好回忆
- **编辑功能**：随时修改已发布的日志
- **心情标签**：为每篇日志添加心情标记

### 🍳 菜谱点菜
- **菜品管理**：分类展示菜品，支持排序和编辑
- **点菜流程**：完整的点菜→制作→完成流程
- **随机订单号**：自动生成8位随机订单号
- **多操作按钮**：前进、撤销、删除，操作可逆
- **统计图表**：可视化展示点菜趋势和统计数据
- **日期筛选**：按今天、近7天、近30天、全部筛选

### ✈️ 旅行计划
- **行程规划**：记录旅行目的地和时间
- **状态跟踪**：计划中、进行中、已完成三种状态
- **封面图片**：为每次旅行添加精美封面

### 📌 备忘录
- **快速记录**：随手记下重要事项
- **颜色标记**：不同颜色的便签区分优先级
- **置顶功能**：重要事项可以置顶显示

### 🖼️ 相册 gallery
- **照片分类**：按类别整理照片
- **时间轴展示**：按拍摄时间排序
- ** captions**：为每张照片添加说明

## ️ 技术栈

### 前端
- **框架**: React 18.3+
- **路由**: react-router-dom 6.28+
- **样式**: Tailwind CSS + PostCSS
- **构建工具**: Vite 6 + TypeScript 5.6
- **开发语言**: TypeScript

### 后端
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **存储**: Supabase Storage
- **Edge Functions**: 安全的用户管理API
- **实时订阅**: Supabase Realtime

### 部署
- **前端**: GitHub Pages
- **CI/CD**: GitHub Actions 自动部署
- **版本控制**: Git + GitHub

## 🚀 快速开始

### 环境要求
- Node.js 20+
- npm 或 yarn
- Supabase 账号

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/Aaron-Man/our-space.git
cd our-space
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
在项目根目录创建 `.env` 文件：
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **初始化数据库**
在 Supabase SQL Editor 中执行 `supabase/schema.sql` 脚本

5. **启动开发服务器**
```bash
npm run dev
```

6. **访问应用**
打开浏览器访问 `http://localhost:5173`

### 可用命令

```bash
# 开发模式
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 📁 项目结构

```
our-space/
├── src/
│   ├── components/          # 公共组件
│   │   ├── Layout.tsx       # 布局组件
│   │   ├── Navbar.tsx       # 导航栏
│   │   └── ProtectedRoute.tsx
│   ├── lib/                 # 工具库
│   │   ├── ThemeContext.tsx # 主题上下文
│   │   └── supabase.ts      # Supabase 客户端
│   ├── pages/               # 页面组件
│   │   ├── Home.tsx         # 首页
│   │   ├── Settings.tsx     # 设置页
│   │   ├── Status.tsx       # 状态动态
│   │   ├── Journal.tsx      # 日志日记
│   │   ├── Menu.tsx         # 菜谱菜单
│   │   ├── Orders.tsx       # 点菜记录
│   │   ├── Travel.tsx       # 旅行计划
│   │   ├── Memo.tsx         # 备忘录
│   │   └── Gallery.tsx      # 相册
│   ├── types/               # TypeScript 类型定义
│   ├── App.tsx              # 应用入口
│   └── main.tsx             # React 入口
├── supabase/                # Supabase 配置
│   ├── schema.sql           # 数据库 Schema
│   ── functions/           # Edge Functions
│       └── manage-users/    # 用户管理函数
├── .github/workflows/       # GitHub Actions
│   └── deploy.yml           # 自动部署配置
├── package.json
├── tsconfig.json
── vite.config.ts
└── tailwind.config.ts
```

## ️ 数据库设计

### 核心表结构

- **profiles**: 用户信息表
- **statuses**: 状态动态表
- **journals**: 日志日记表
- **categories**: 菜谱分类表
- **dishes**: 菜谱表
- **orders**: 点菜订单表
- **travels**: 旅行计划表
- **memos**: 备忘录表
- **photos**: 相册表
- **custom_backgrounds**: 共享自定义背景表

### RLS (Row Level Security)

所有表都启用了行级安全策略，确保数据安全：
- 所有人可读共享数据（菜谱、分类等）
- 登录用户可写自己的数据
- 管理员可管理所有用户

## 🎨 设计理念

### 视觉风格
- **温馨浪漫**：柔和的配色方案，营造家的感觉
- **毛玻璃效果**：现代感的 backdrop-blur 设计
- **渐变点缀**：蓝紫色系渐变作为装饰元素
- **响应式布局**：完美适配桌面和移动设备

### 用户体验
- **流畅动画**：悬停、过渡效果提升交互体验
- **即时反馈**：Toast 弹窗提供操作确认
- **直观操作**：清晰的按钮和图标引导用户
- **数据共享**：所有用户看到相同的内容，增强协作感

## 🔐 安全性

- **JWT 认证**：基于 Supabase Auth 的安全认证
- **RLS 策略**：细粒度的数据访问控制
- **Edge Functions**：服务端逻辑保护敏感操作
- **环境变量**：密钥通过环境变量管理，不提交到代码库

##  部署

### GitHub Pages 自动部署

项目配置了 GitHub Actions，推送到 `main` 分支后自动部署：

1. 提交代码到 main 分支
2. GitHub Actions 自动触发
3. 构建 Vite 项目
4. 部署到 GitHub Pages

访问地址：`https://aaron-man.github.io/our-space/`

### 手动部署到其他平台

如需部署到 Vercel、Netlify 等平台：

1. 移除 `.github/workflows/deploy.yml`
2. 在目标平台导入项目
3. 配置环境变量
4. 执行部署

##  贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📝 更新日志

### v1.0.0 (2026-09-20)
- ✅ 完整的多用户协作系统
- ✅ 管理员用户管理功能
- ✅ 18种精美主题 + 自定义背景
- ✅ 菜谱点菜系统（含统计图表）
- ✅ 状态动态、日志、旅行、备忘录、相册
- ✅ 响应式设计，移动端优化
- ✅ Supabase 后端集成
- ✅ GitHub Pages 自动部署

## 🙏 致谢

- [Supabase](https://supabase.com/) - 强大的后端即服务平台
- [React](https://react.dev/) - 现代化的 UI 库
- [Tailwind CSS](https://tailwindcss.com/) - 实用的 CSS 框架
- [Vite](https://vitejs.dev/) - 极速的前端构建工具

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📧 联系方式

- 项目主页: [https://github.com/Aaron-Man/our-space](https://github.com/Aaron-Man/our-space)
- 问题反馈: [Issues](https://github.com/Aaron-Man/our-space/issues)

---

Made with ❤️ for us
