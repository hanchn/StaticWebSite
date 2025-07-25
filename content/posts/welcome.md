---
title: "欢迎使用静态博客系统"
date: "2024-01-01 10:00:00"
author: "博客管理员"
category: "公告"
tags: ["欢迎", "博客", "静态生成"]
description: "欢迎使用基于 Node.js + Express + EJS 的静态博客系统"
cover: ""
draft: false
---

# 欢迎使用静态博客系统

恭喜您成功搭建了基于 **Node.js + Express + EJS** 的静态博客系统！

<!-- more -->

## 🎉 功能特色

### 双模式运行
- **开发模式**: 使用 Express 服务器动态渲染，支持实时预览
- **生产模式**: 生成纯静态 HTML 文件，可部署到任何静态托管服务

### 内容管理
- ✅ 支持 Markdown 格式编写文章
- ✅ Front Matter 元数据管理
- ✅ 在线编辑器界面
- ✅ 文件上传功能
- ✅ 分类和标签系统

### 主题系统
- ✅ 响应式设计
- ✅ 现代化 UI 界面
- ✅ 易于定制的模板系统

## 🚀 快速开始

### 1. 开发模式
```bash
npm run dev
```
访问 http://localhost:3000 查看博客
访问 http://localhost:3000/admin 进入管理界面

### 2. 创建文章
1. 访问管理界面
2. 点击"新建文章"
3. 使用 Markdown 语法编写内容
4. 设置分类、标签等元数据
5. 保存并预览

### 3. 生成静态文件
```bash
npm run build
```
静态文件将生成到 `dist/` 目录

### 4. 预览静态站点
```bash
npm run preview
```

## 📝 Markdown 语法示例

### 代码块
```javascript
// JavaScript 代码示例
const greeting = "Hello, World!";
console.log(greeting);
```

### 表格
| 功能 | 状态 | 说明 |
|------|------|------|
| 文章管理 | ✅ | 支持增删改查 |
| 静态生成 | ✅ | 一键生成静态站点 |
| 主题定制 | ✅ | 基于 EJS 模板 |

### 引用
> 这是一个基于现代技术栈的静态博客系统，旨在提供简单易用的博客搭建体验。

## 🔧 自定义配置

您可以通过修改 `config/config.js` 文件来自定义站点配置：

- 站点标题和描述
- 导航菜单
- 社交链接
- SEO 设置
- 主题配置

## 📚 更多资源

- [项目文档](https://github.com/your-repo)
- [主题开发指南](https://github.com/your-repo/wiki)
- [部署指南](https://github.com/your-repo/docs)

---

感谢您选择我们的静态博客系统，祝您使用愉快！ 🎊