# 静态博客系统

一个基于 Node.js (Express ES6) + EJS 的静态博客生成器，支持动态预览、静态生成和在线管理。

## 🏗️ 项目架构

### 技术栈
- **后端**: Node.js + Express (ES6 模块)
- **模板引擎**: EJS
- **Markdown 解析**: marked + gray-matter
- **静态生成**: 自定义构建脚本
- **文件存储**: 本地文件系统（无数据库依赖）

### 目录结构
```
static-blog/
├── app.js                 # 开发服务器入口
├── package.json           # 项目配置
├── .gitignore            # Git 忽略文件
├── README.md             # 项目说明
├── config/               # 配置文件
│   └── config.js         # 站点配置
├── content/              # 内容存储
│   ├── posts/            # 博客文章 (Markdown)
│   ├── pages/            # 静态页面
│   └── uploads/          # 上传文件
├── views/                # EJS 模板
│   ├── layouts/          # 布局模板
│   ├── partials/         # 组件模板
│   ├── pages/            # 页面模板
│   └── admin/            # 管理界面模板
├── public/               # 静态资源
│   ├── css/              # 样式文件
│   ├── js/               # 客户端脚本
│   └── images/           # 图片资源
├── routes/               # 路由模块
│   ├── index.js          # 前台路由
│   ├── admin.js          # 管理路由
│   └── api.js            # API 路由
├── utils/                # 工具函数
│   ├── markdown.js       # Markdown 处理
│   ├── file.js           # 文件操作
│   └── helpers.js        # 模板助手
├── scripts/              # 构建脚本
│   ├── build.js          # 静态生成脚本
│   └── preview.js        # 预览服务器
└── dist/                 # 生成的静态文件
    ├── index.html
    ├── posts/
    ├── assets/
    └── ...
```

## 🎯 产品设计

### 核心功能

#### 1. 双模式运行
- **开发模式**: Express 服务器动态渲染，支持热重载
- **生产模式**: 生成纯静态 HTML 文件，可部署到任何静态托管服务

#### 2. 内容管理
- **文章管理**: 支持 Markdown 格式，Front Matter 元数据
- **在线编辑**: Web 界面创建、编辑、删除文章
- **文件上传**: 支持图片等媒体文件上传
- **分类标签**: 支持文章分类和标签系统

#### 3. 主题系统
- **响应式设计**: 移动端友好的现代化界面
- **模板继承**: 基于 EJS 的灵活模板系统
- **自定义样式**: 易于定制的 CSS 架构

#### 4. 静态生成
- **全站静态化**: 将动态内容生成为静态 HTML
- **资源优化**: 自动处理 CSS/JS 资源
- **SEO 友好**: 生成完整的 meta 标签和结构化数据

### 工作流程

1. **内容创作**
   ```
   访问管理界面 → 创建/编辑文章 → 保存为 Markdown 文件
   ```

2. **开发预览**
   ```
   npm run dev → Express 服务器 → 动态渲染预览
   ```

3. **静态部署**
   ```
   npm run build → 生成静态文件 → 部署到静态托管
   ```

### 数据存储设计

#### 文章格式 (Markdown + Front Matter)
```markdown
---
title: "文章标题"
date: "2024-01-01"
author: "作者"
category: "技术"
tags: ["Node.js", "博客"]
description: "文章描述"
cover: "/images/cover.jpg"
draft: false
---

# 文章内容

这里是 Markdown 格式的文章内容...
```

#### 配置文件 (config.js)
```javascript
export default {
  site: {
    title: "我的博客",
    description: "个人技术博客",
    author: "作者名",
    url: "https://myblog.com"
  },
  build: {
    outputDir: "dist",
    publicPath: "/"
  }
}
```

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
# 访问 http://localhost:3000
# 管理界面: http://localhost:3000/admin
```

### 生成静态文件
```bash
npm run build
# 静态文件生成到 dist/ 目录
```

### 预览静态文件
```bash
npm run preview
# 预览生成的静态站点
```

## 📝 使用说明

1. **创建文章**: 访问 `/admin` 管理界面，点击"新建文章"
2. **编辑内容**: 使用 Markdown 语法编写文章内容
3. **设置元数据**: 填写标题、分类、标签等信息
4. **预览效果**: 保存后可在前台查看效果
5. **生成静态**: 运行 `npm run build` 生成部署文件

## 🔧 自定义配置

- 修改 `config/config.js` 调整站点配置
- 编辑 `views/` 目录下的模板文件自定义界面
- 修改 `public/css/` 目录下的样式文件调整外观

## 📦 部署方式

### 静态托管 (推荐)
1. 运行 `npm run build` 生成静态文件
2. 将 `dist/` 目录上传到静态托管服务
3. 支持 GitHub Pages、Netlify、Vercel 等平台

### 服务器部署
1. 上传项目文件到服务器
2. 安装 Node.js 和依赖
3. 运行 `npm start` 启动服务

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📄 许可证

MIT License