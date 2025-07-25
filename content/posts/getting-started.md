---
title: "快速入门指南"
date: "2024-01-02 14:30:00"
author: "博客管理员"
category: "教程"
tags: ["入门", "教程", "指南"]
description: "详细的博客系统使用指南，帮助您快速上手"
cover: ""
draft: false
---

# 快速入门指南

本文将详细介绍如何使用这个静态博客系统，从安装到发布文章的完整流程。

<!-- more -->

## 📦 安装与配置

### 1. 环境要求
- Node.js 16.0 或更高版本
- npm 或 yarn 包管理器

### 2. 安装依赖
```bash
# 安装项目依赖
npm install

# 或使用 yarn
yarn install
```

### 3. 配置站点信息
编辑 `config/config.js` 文件，修改以下配置：

```javascript
export default {
  site: {
    title: "您的博客标题",
    description: "您的博客描述",
    author: "您的名字",
    url: "https://yourdomain.com"
  },
  // 其他配置...
}
```

## ✍️ 创建文章

### 方法一：使用管理界面
1. 启动开发服务器：`npm run dev`
2. 访问 http://localhost:3000/admin
3. 点击"新建文章"按钮
4. 填写文章信息并编写内容
5. 点击"保存"按钮

### 方法二：手动创建 Markdown 文件
在 `content/posts/` 目录下创建 `.md` 文件：

```markdown
---
title: "文章标题"
date: "2024-01-01 12:00:00"
author: "作者名"
category: "分类名"
tags: ["标签1", "标签2"]
description: "文章描述"
cover: "/uploads/cover.jpg"
draft: false
---

# 文章内容

这里是文章的正文内容...
```

## 🎨 Front Matter 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | String | ✅ | 文章标题 |
| date | String | ✅ | 发布日期 (YYYY-MM-DD HH:mm:ss) |
| author | String | ❌ | 作者名（默认使用配置中的作者） |
| category | String | ❌ | 文章分类 |
| tags | Array | ❌ | 文章标签 |
| description | String | ❌ | 文章描述（用于 SEO） |
| cover | String | ❌ | 封面图片路径 |
| draft | Boolean | ❌ | 是否为草稿（默认 false） |

## 🖼️ 图片管理

### 上传图片
1. 在管理界面的文章编辑页面
2. 点击"上传图片"按钮
3. 选择图片文件
4. 系统会自动生成图片链接

### 图片路径
- 上传的图片保存在 `content/uploads/` 目录
- 在文章中使用相对路径：`/uploads/filename.jpg`
- 支持的格式：JPG, PNG, GIF, WebP

## 🏗️ 静态生成

### 生成静态文件
```bash
npm run build
```

生成的文件结构：
```
dist/
├── index.html          # 首页
├── posts/              # 文章列表页
├── post/               # 文章详情页
├── category/           # 分类页面
├── tag/                # 标签页面
├── about.html          # 关于页面
├── assets/             # 静态资源
├── uploads/            # 上传文件
├── rss.xml             # RSS 订阅
└── sitemap.xml         # 站点地图
```

### 预览静态站点
```bash
npm run preview
```

## 🚀 部署指南

### 静态托管平台
1. **GitHub Pages**
   - 将 `dist/` 目录内容推送到 `gh-pages` 分支
   - 在仓库设置中启用 GitHub Pages

2. **Netlify**
   - 连接 GitHub 仓库
   - 设置构建命令：`npm run build`
   - 设置发布目录：`dist`

3. **Vercel**
   - 导入 GitHub 仓库
   - 自动检测构建设置

### 服务器部署
```bash
# 1. 上传项目文件到服务器
# 2. 安装依赖
npm install --production

# 3. 生成静态文件
npm run build

# 4. 使用 nginx 或其他 web 服务器托管 dist 目录
```

## 🔧 高级配置

### 自定义主题
1. 修改 `views/` 目录下的 EJS 模板
2. 编辑 `public/css/` 目录下的样式文件
3. 重新生成静态文件

### SEO 优化
- 在 `config.js` 中设置 SEO 相关配置
- 为每篇文章添加 `description` 字段
- 使用合适的标题和标签

### 性能优化
- 压缩图片文件
- 使用 CDN 加速静态资源
- 启用 gzip 压缩

## 🆘 常见问题

### Q: 如何修改网站标题？
A: 编辑 `config/config.js` 文件中的 `site.title` 字段。

### Q: 如何添加自定义页面？
A: 在 `views/pages/` 目录下创建新的 EJS 模板，并在路由中添加对应的处理逻辑。

### Q: 如何备份文章？
A: 文章以 Markdown 文件形式保存在 `content/posts/` 目录，直接备份该目录即可。

---

希望这个入门指南能帮助您快速上手博客系统！如有问题，欢迎查看项目文档或提交 Issue。