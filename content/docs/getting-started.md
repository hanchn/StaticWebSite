---
title: "快速开始"
date: 2024-01-15
author: "文档团队"
categories: ["文档"]
tags: ["入门", "安装", "配置"]
description: "静态网站生成器的快速入门指南，帮助你在几分钟内搭建自己的网站。"
order: 1
---

# 快速开始

欢迎使用我们的静态网站生成器！本指南将帮助你在几分钟内搭建并运行你的第一个静态网站。

## 系统要求

在开始之前，请确保你的系统满足以下要求：

- **Node.js** 16.0 或更高版本
- **npm** 7.0 或更高版本（或 yarn 1.22+）
- **Git**（可选，用于版本控制）

### 检查系统环境

```bash
# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 检查 Git 版本（可选）
git --version
```

## 安装

### 方法一：使用 npm（推荐）

```bash
# 全局安装
npm install -g static-site-generator

# 或者使用 npx（无需全局安装）
npx static-site-generator init my-website
```

### 方法二：从源码安装

```bash
# 克隆仓库
git clone https://github.com/yourorg/static-site-generator.git
cd static-site-generator

# 安装依赖
npm install

# 全局链接
npm link
```

## 创建新项目

### 使用 CLI 工具

```bash
# 创建新项目
static-site-generator init my-website

# 进入项目目录
cd my-website

# 安装依赖
npm install
```

### 手动创建

如果你喜欢手动设置，可以按照以下步骤：

1. **创建项目目录**

```bash
mkdir my-website
cd my-website
```

2. **初始化 package.json**

```bash
npm init -y
```

3. **安装依赖**

```bash
npm install static-site-generator
```

4. **创建基本目录结构**

```bash
mkdir -p content/{posts,pages,docs}
mkdir -p public/{css,js,images}
mkdir -p templates/{layouts,partials}
```

## 项目结构

创建完成后，你的项目结构应该如下：

```
my-website/
├── content/                 # 内容目录
│   ├── posts/              # 博客文章
│   ├── pages/              # 静态页面
│   └── docs/               # 文档
├── public/                 # 静态资源
│   ├── css/               # 样式文件
│   ├── js/                # JavaScript 文件
│   └── images/            # 图片资源
├── templates/              # 模板文件
│   ├── layouts/           # 布局模板
│   └── partials/          # 部分模板
├── dist/                   # 构建输出（自动生成）
├── package.json           # 项目配置
├── site.config.js         # 网站配置
└── build.config.js        # 构建配置
```

## 配置网站

### 基本配置

编辑 `site.config.js` 文件：

```javascript
module.exports = {
  // 网站基本信息
  title: '我的网站',
  description: '这是我的个人网站',
  author: '你的名字',
  url: 'https://yoursite.com',
  
  // 构建配置
  build: {
    outputDir: 'dist',
    publicPath: '/'
  },
  
  // 路由配置
  routes: {
    posts: {
      path: '/posts/:slug',
      template: 'post'
    },
    pages: {
      path: '/:slug',
      template: 'page'
    }
  }
};
```

### 高级配置

编辑 `build.config.js` 文件进行更详细的配置：

```javascript
module.exports = {
  // Markdown 处理配置
  markdown: {
    highlight: true,
    breaks: true,
    linkify: true
  },
  
  // 插件配置
  plugins: {
    search: {
      enabled: true,
      fields: ['title', 'content', 'tags']
    },
    seo: {
      enabled: true,
      sitemap: true,
      robots: true
    },
    rss: {
      enabled: true,
      limit: 20
    }
  }
};
```

## 创建内容

### 创建第一篇文章

```bash
# 使用 CLI 创建
npm run new post "我的第一篇文章"

# 或手动创建
touch content/posts/my-first-post.md
```

编辑 `content/posts/my-first-post.md`：

```markdown
---
title: "我的第一篇文章"
date: 2024-01-15
author: "你的名字"
categories: ["技术"]
tags: ["入门", "教程"]
description: "这是我的第一篇文章"
---

# 欢迎来到我的网站

这是我使用静态网站生成器创建的第一篇文章！

## 主要特性

- 支持 Markdown
- 自动生成导航
- SEO 友好
- 响应式设计

开始写作吧！
```

### 创建页面

```bash
# 创建关于页面
touch content/pages/about.md
```

编辑 `content/pages/about.md`：

```markdown
---
title: "关于我"
date: 2024-01-15
template: "page"
permalink: "/about/"
---

# 关于我

这里是关于我的介绍...
```

## 开发和构建

### 启动开发服务器

```bash
# 启动开发服务器（带热重载）
npm run dev
```

开发服务器将在 `http://localhost:3000` 启动，支持：

- 🔥 热重载
- 📝 实时预览
- 🔍 开发者工具
- 📊 构建状态

### 构建生产版本

```bash
# 构建网站
npm run build
```

构建完成后，静态文件将生成在 `dist/` 目录中。

### 预览构建结果

```bash
# 预览构建的网站
npm run preview
```

## 部署

### 部署到 GitHub Pages

1. **创建 GitHub 仓库**

2. **配置 GitHub Actions**

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '16'
        
    - name: Install dependencies
      run: npm install
      
    - name: Build
      run: npm run build
      
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### 部署到 Netlify

1. **连接 Git 仓库**
2. **设置构建命令**：`npm run build`
3. **设置发布目录**：`dist`
4. **部署**

### 部署到 Vercel

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
vercel
```

## 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览构建结果
npm run clean        # 清理缓存和输出

# 内容管理
npm run new post "标题"     # 创建新文章
npm run new page "标题"     # 创建新页面
npm run new doc "标题"      # 创建新文档

# 部署
npm run deploy       # 部署到配置的服务器
```

## 下一步

恭喜！你已经成功创建了第一个静态网站。接下来你可以：

1. **[自定义模板](/docs/templates/)** - 学习如何创建和修改模板
2. **[配置指南](/docs/configuration/)** - 深入了解配置选项
3. **[插件系统](/docs/plugins/)** - 使用和开发插件
4. **[部署指南](/docs/deployment/)** - 了解各种部署选项
5. **[最佳实践](/docs/best-practices/)** - 学习最佳实践

## 获取帮助

如果你遇到问题，可以：

- 📖 查看[完整文档](/docs/)
- 🐛 [提交 Issue](https://github.com/yourorg/static-site-generator/issues)
- 💬 [加入讨论](https://github.com/yourorg/static-site-generator/discussions)
- 📧 [联系我们](/contact/)

---

*祝你使用愉快！*