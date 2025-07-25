---
title: 欢迎使用静态网站生成器
date: 2024-01-15
author: 系统管理员
category: 公告
tags: [欢迎, 开始, 教程]
excerpt: 这是您的第一篇文章，让我们开始探索这个强大的静态网站生成器吧！
---

# 欢迎来到您的新网站！

恭喜您成功搭建了这个基于 EJS 模板引擎的静态网站生成器！这个系统专为大规模项目和知识库设计，具有以下特点：

## 🚀 主要特性

### 现代化的技术栈
- **EJS 模板引擎**：灵活强大的模板系统
- **Markdown 支持**：使用 Markdown 编写内容
- **响应式设计**：适配各种设备屏幕
- **SEO 优化**：自动生成 sitemap 和 RSS

### 丰富的功能
- 📝 文章管理系统
- 🏷️ 标签和分类
- 🔍 内容搜索
- 📊 统计信息
- 🎨 主题定制

## 📁 项目结构

```
├── content/          # 内容文件
│   ├── posts/       # 博客文章
│   ├── pages/       # 静态页面
│   └── docs/        # 文档
├── templates/        # EJS 模板
├── static/          # 静态资源
│   ├── css/        # 样式文件
│   ├── js/         # JavaScript
│   └── images/     # 图片资源
├── plugins/         # 插件系统
└── dist/           # 生成的网站
```

## 🛠️ 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 构建网站
```bash
npm run build
```

### 3. 清理输出
```bash
npm run clean
```

## ✍️ 创建内容

### 写文章
在 `content/posts/` 目录下创建 Markdown 文件：

```markdown
---
title: 文章标题
date: 2024-01-15
author: 作者名
category: 分类
tags: [标签1, 标签2]
excerpt: 文章摘要
---

这里是文章内容...
```

### 创建页面
在 `content/pages/` 目录下创建页面文件：

```markdown
---
title: 页面标题
layout: page
---

这里是页面内容...
```

## 🎨 自定义样式

您可以通过修改 `static/css/main.css` 来自定义网站样式。系统支持：

- 响应式布局
- 深色模式
- 自定义主题色
- 动画效果

## 🔧 配置选项

在 `config.js` 中可以配置：

- 网站基本信息
- 构建选项
- 目录结构
- 导航菜单
- SEO 设置

## 📈 性能优化

- **静态生成**：所有页面都是静态 HTML
- **资源优化**：CSS 和 JS 文件压缩
- **图片优化**：支持现代图片格式
- **缓存友好**：合理的缓存策略

## 🌟 高级功能

### 插件系统
支持自定义插件扩展功能：

```javascript
// plugins/example.js
module.exports = {
  name: 'example',
  process: (content, config) => {
    // 处理逻辑
    return content;
  }
};
```

### 自定义模板
使用 EJS 创建自定义模板：

```html
<!-- templates/custom.ejs -->
<% include('partials/header') %>
<main>
  <%- content %>
</main>
<% include('partials/footer') %>
```

## 🚀 部署

生成的静态网站可以部署到任何静态托管服务：

- **GitHub Pages**
- **Netlify**
- **Vercel**
- **AWS S3**
- **阿里云 OSS**

## 📚 更多资源

- [Markdown 语法指南](https://markdown.com.cn/)
- [EJS 模板文档](https://ejs.co/)
- [响应式设计最佳实践](https://web.dev/responsive-web-design-basics/)

---

现在您可以开始创建自己的内容了！如果您有任何问题，请查看文档或联系技术支持。

祝您使用愉快！ 🎉