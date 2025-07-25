---
title: "Hello World - 我的第一篇文章"
date: 2024-01-15
author: "作者名称"
categories: ["技术", "教程"]
tags: ["静态网站", "Markdown", "入门"]
description: "这是使用静态网站生成器创建的第一篇文章，介绍了基本的使用方法和功能特性。"
cover: "/images/hello-world-cover.jpg"
draft: false
featured: true
---

# 欢迎使用静态网站生成器

这是你的第一篇文章！这个静态网站生成器提供了强大而灵活的功能，让你可以轻松创建和管理静态网站。

## 主要特性

### 1. Markdown 支持

你可以使用标准的 Markdown 语法来编写内容：

- **粗体文本**
- *斜体文本*
- `行内代码`
- [链接](https://example.com)

### 2. 代码高亮

支持多种编程语言的语法高亮：

```javascript
function greet(name) {
  console.log(`Hello, ${name}!`);
}

greet('World');
```

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

print(fibonacci(10))
```

### 3. 表格支持

| 功能 | 描述 | 状态 |
|------|------|------|
| Markdown 解析 | 支持标准 Markdown 语法 | ✅ |
| 代码高亮 | 多语言语法高亮 | ✅ |
| 响应式设计 | 移动端友好 | ✅ |
| SEO 优化 | 自动生成 meta 标签 | ✅ |

### 4. 引用和提示

> 这是一个引用块。你可以用它来突出显示重要的信息或引用其他来源的内容。

### 5. 列表

#### 有序列表
1. 第一步：安装依赖
2. 第二步：配置网站
3. 第三步：创建内容
4. 第四步：构建网站

#### 无序列表
- 支持多种模板
- 自动生成导航
- SEO 友好
- 响应式设计

## 开始使用

### 创建新文章

要创建新文章，只需在 `content/posts/` 目录下创建一个新的 Markdown 文件：

```bash
# 使用 CLI 工具创建
npm run new post "文章标题"

# 或手动创建
touch content/posts/my-new-post.md
```

### Front Matter 配置

每篇文章都应该包含 Front Matter 配置：

```yaml
---
title: "文章标题"
date: 2024-01-15
author: "作者名称"
categories: ["分类1", "分类2"]
tags: ["标签1", "标签2"]
description: "文章描述"
cover: "/images/cover.jpg"
draft: false
featured: false
---
```

### 图片和媒体

你可以在文章中插入图片：

![示例图片](/images/example.jpg "图片标题")

### 数学公式

支持 LaTeX 数学公式（如果启用了相关插件）：

行内公式：$E = mc^2$

块级公式：
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$

## 高级功能

### 1. 自定义组件

你可以在 Markdown 中使用自定义组件：

```html
<div class="alert alert-info">
  <strong>提示：</strong>这是一个信息提示框。
</div>
```

### 2. 内容包含

可以包含其他文件的内容：

```markdown
{% include "snippets/common-footer.md" %}
```

### 3. 代码文件包含

直接包含代码文件：

```markdown
{% code "examples/hello.js" %}
```

## 部署

构建完成后，你可以将生成的静态文件部署到任何静态网站托管服务：

- GitHub Pages
- Netlify
- Vercel
- AWS S3
- 传统的 Web 服务器

```bash
# 构建网站
npm run build

# 预览构建结果
npm run preview
```

## 总结

这个静态网站生成器提供了：

✅ **简单易用** - 零配置即可开始使用  
✅ **功能丰富** - 支持搜索、RSS、SEO 等功能  
✅ **高度可定制** - 灵活的模板和插件系统  
✅ **性能优秀** - 生成的静态网站加载速度快  
✅ **开发友好** - 热重载开发服务器和 CLI 工具  

开始创建你的内容吧！如果你有任何问题，请查看文档或提交 Issue。

---

*本文最后更新于：2024年1月15日*