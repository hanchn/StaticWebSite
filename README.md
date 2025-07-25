# 静态网站生成器

一个现代化、高性能的静态网站生成器，专为开发者和内容创作者设计。

## ✨ 特性

### 🚀 核心功能
- **零配置启动** - 开箱即用，无需复杂配置
- **Markdown 支持** - 完整的 Markdown 语法支持，包括代码高亮
- **响应式设计** - 自适应各种设备和屏幕尺寸
- **SEO 优化** - 自动生成 meta 标签、sitemap 和 robots.txt
- **高性能** - 生成的静态网站加载速度极快

### 🔍 搜索功能
- **全文搜索** - 支持标题、内容、标签的全文搜索
- **实时搜索** - 输入即搜索，无需等待
- **搜索建议** - 智能搜索建议和自动补全
- **搜索高亮** - 搜索结果关键词高亮显示

### 📡 API 支持
- **静态 API** - 自动生成 JSON API 文件
- **RESTful 风格** - 符合 REST 规范的 API 设计
- **数据结构化** - 结构化的数据输出格式
- **缓存优化** - 支持 HTTP 缓存策略

### 📰 RSS 订阅
- **多格式支持** - RSS、Atom、JSON Feed
- **分类订阅** - 支持按分类和标签订阅
- **自定义配置** - 灵活的 RSS 配置选项

### 🎨 开发体验
- **热重载** - 文件修改后自动刷新浏览器
- **开发服务器** - 内置开发服务器，支持实时预览
- **CLI 工具** - 强大的命令行工具
- **插件系统** - 可扩展的插件架构

## 🚀 快速开始

### 安装

```bash
# 使用 npm
npm install -g static-site-generator

# 或使用 yarn
yarn global add static-site-generator

# 或使用 npx（无需全局安装）
npx static-site-generator init my-website
```

### 创建项目

```bash
# 创建新项目
static-site-generator init my-website
cd my-website

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 项目结构

```
my-website/
├── content/                 # 内容目录
│   ├── posts/              # 博客文章
│   │   ├── hello-world.md
│   │   └── markdown-guide.md
│   ├── pages/              # 静态页面
│   │   └── about.md
│   └── docs/               # 文档
│       └── getting-started.md
├── public/                 # 静态资源
│   ├── css/               # 样式文件
│   │   └── style.css
│   ├── js/                # JavaScript 文件
│   │   └── main.js
│   └── images/            # 图片资源
├── templates/              # 模板文件
│   ├── layouts/           # 布局模板
│   │   └── default.ejs
│   ├── index.ejs          # 首页模板
│   ├── post.ejs           # 文章模板
│   └── posts.ejs          # 文章列表模板
├── lib/                    # 核心库文件
│   ├── builder.js         # 构建器
│   ├── router.js          # 路由器
│   ├── template.js        # 模板引擎
│   ├── processor.js       # 内容处理器
│   ├── plugin.js          # 插件系统
│   ├── utils.js           # 工具函数
│   └── dev-server.js      # 开发服务器
├── plugins/                # 插件目录
│   ├── search.js          # 搜索插件
│   ├── seo.js             # SEO 插件
│   └── rss.js             # RSS 插件
├── bin/                    # CLI 工具
│   └── cli.js
├── dist/                   # 构建输出（自动生成）
├── package.json           # 项目配置
├── site.config.js         # 网站配置
├── build.config.js        # 构建配置
└── README.md              # 项目说明
```

## 📝 使用指南

### 创建内容

#### 创建文章

```bash
# 使用 CLI 创建
npm run new post "文章标题"

# 或手动创建
touch content/posts/my-post.md
```

文章格式：

```markdown
---
title: "文章标题"
date: 2024-01-15
author: "作者名称"
categories: ["技术", "教程"]
tags: ["标签1", "标签2"]
description: "文章描述"
cover: "/images/cover.jpg"
draft: false
featured: true
---

# 文章内容

这里是文章的正文内容...
```

#### 创建页面

```bash
# 创建页面
npm run new page "页面标题"
```

页面格式：

```markdown
---
title: "页面标题"
date: 2024-01-15
template: "page"
permalink: "/custom-url/"
---

# 页面内容

这里是页面的内容...
```

### 配置网站

#### 基本配置 (site.config.js)

```javascript
module.exports = {
  // 网站基本信息
  title: '我的网站',
  description: '网站描述',
  author: '作者名称',
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
    }
  },
  
  // SEO 配置
  seo: {
    keywords: ['关键词1', '关键词2'],
    ogImage: '/images/og-image.jpg'
  }
};
```

#### 构建配置 (build.config.js)

```javascript
module.exports = {
  // Markdown 配置
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
      sitemap: true
    },
    rss: {
      enabled: true,
      limit: 20
    }
  }
};
```

### 自定义模板

模板使用 EJS 语法：

```html
<!-- templates/layouts/default.ejs -->
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title><%= page.title %> - <%= site.title %></title>
  <meta name="description" content="<%= page.description || site.description %>">
</head>
<body>
  <header>
    <h1><%= site.title %></h1>
  </header>
  
  <main>
    <%- content %>
  </main>
  
  <footer>
    <p>&copy; <%= new Date().getFullYear() %> <%= site.author %></p>
  </footer>
</body>
</html>
```

## 🔧 命令行工具

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

## 🔌 插件系统

### 内置插件

- **搜索插件** - 全文搜索功能
- **SEO 插件** - SEO 优化
- **RSS 插件** - RSS 订阅支持

### 自定义插件

```javascript
// plugins/my-plugin.js
module.exports = {
  name: 'my-plugin',
  version: '1.0.0',
  
  // 插件初始化
  init(builder, options) {
    console.log('插件初始化');
  },
  
  // 钩子函数
  hooks: {
    'before:build': async (context) => {
      console.log('构建前执行');
    },
    
    'after:build': async (context) => {
      console.log('构建后执行');
    }
  }
};
```

## 🚀 部署

### GitHub Pages

```yaml
# .github/workflows/deploy.yml
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
    - run: npm install
    - run: npm run build
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: ./dist
```

### Netlify

1. 连接 Git 仓库
2. 构建命令：`npm run build`
3. 发布目录：`dist`

### Vercel

```bash
npm install -g vercel
vercel
```

## 🛠️ 开发

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/yourorg/static-site-generator.git
cd static-site-generator

# 安装依赖
npm install

# 启动开发
npm run dev
```

### 测试

```bash
# 运行测试
npm test

# 运行测试覆盖率
npm run test:coverage

# 运行 lint
npm run lint
```

### 构建

```bash
# 构建项目
npm run build

# 构建并预览
npm run build && npm run preview
```

## 📚 文档

- [快速开始](/docs/getting-started/)
- [配置指南](/docs/configuration/)
- [模板开发](/docs/templates/)
- [插件开发](/docs/plugins/)
- [部署指南](/docs/deployment/)
- [API 文档](/docs/api/)

## 🤝 贡献

我们欢迎所有形式的贡献！

### 贡献方式

1. **报告 Bug** - 提交 Issue
2. **功能建议** - 提交 Feature Request
3. **代码贡献** - 提交 Pull Request
4. **文档改进** - 改进文档和示例
5. **社区支持** - 帮助其他用户

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

### 代码规范

- 使用 ESLint 进行代码检查
- 遵循 JavaScript Standard Style
- 编写测试用例
- 更新相关文档

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

感谢所有贡献者和以下开源项目：

- [marked](https://github.com/markedjs/marked) - Markdown 解析器
- [highlight.js](https://github.com/highlightjs/highlight.js) - 代码高亮
- [ejs](https://github.com/mde/ejs) - 模板引擎
- [express](https://github.com/expressjs/express) - Web 框架
- [chokidar](https://github.com/paulmillr/chokidar) - 文件监听

## 📞 联系我们

- **GitHub**: [项目仓库](https://github.com/yourorg/static-site-generator)
- **Issues**: [问题反馈](https://github.com/yourorg/static-site-generator/issues)
- **Discussions**: [讨论区](https://github.com/yourorg/static-site-generator/discussions)
- **Email**: contact@example.com

---

**⭐ 如果这个项目对你有帮助，请给我们一个 Star！**

## 🎯 项目愿景

创建一个极简的静态博客生成器，让用户专注于内容创作而不是复杂的配置。通过文件夹结构自动生成路由，通过模板标识灵活控制页面样式。

## 📋 需求分析

### 核心需求

1. **基于文件结构的路由系统**
   - 根据 `content/` 目录下的文件夹深度和文件名自动生成路由
   - 支持嵌套目录结构
   - 自动识别文章和页面类型

2. **灵活的模板系统**
   - 通过 Front Matter 中的 `template` 字段指定模板
   - 支持自定义模板
   - 提供默认模板

3. **简单的构建系统**
   - 一键生成静态站点
   - 支持增量构建
   - 自动复制静态资源

4. **Markdown 支持**
   - 完整的 Markdown 语法支持
   - Front Matter 元数据支持
   - 代码高亮

### 功能需求

- ✅ 文章管理（基于 Markdown 文件）
- ✅ 页面管理（静态页面）
- ✅ 模板系统（EJS 模板引擎）
- ✅ 静态资源处理
- ✅ 站点地图生成
- ✅ 响应式设计
- ✅ SEO 优化

### 非功能需求

- **性能**: 快速构建，轻量级输出
- **易用性**: 零配置启动，直观的文件结构
- **可扩展性**: 支持自定义模板和插件
- **兼容性**: 支持现代浏览器

## 🏗️ 系统架构

### 核心架构层次

```
┌─────────────────────────────────────────────────────────────┐
│                     配置管理层                              │
│  ├── 站点配置 (site.config.js)                            │
│  ├── 构建配置 (build.config.js)                           │
│  └── 插件配置 (plugins.config.js)                         │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     内容管理层                              │
│  ├── Markdown 解析 (gray-matter + marked)                 │
│  ├── Front Matter 处理                                     │
│  ├── 静态资源管理                                          │
│  └── 搜索索引生成                                          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     路由生成层                              │
│  ├── 文件路径映射                                          │
│  ├── URL 规则生成                                          │
│  ├── 分类/标签路由                                         │
│  └── API 路由生成                                          │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     模板渲染层                              │
│  ├── EJS 模板引擎                                          │
│  ├── 模板选择逻辑                                          │
│  ├── 数据注入                                              │
│  └── SEO 优化                                              │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     构建输出层                              │
│  ├── 静态文件生成                                          │
│  ├── RSS/Sitemap 生成                                      │
│  ├── 搜索 API 生成                                         │
│  ├── 资源优化                                              │
│  └── 部署准备                                              │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     插件扩展层                              │
│  ├── 钩子系统                                              │
│  ├── 自定义处理器                                          │
│  ├── 主题系统                                              │
│  └── 第三方集成                                            │
└─────────────────────────────────────────────────────────────┘
```

### 目录结构设计

```
static-blog-generator/
├── content/                    # 内容目录
│   ├── posts/                  # 博客文章 → /post/{filename}
│   │   ├── 2024/
│   │   │   ├── hello-world.md
│   │   │   └── my-journey.md
│   │   └── tech/
│   │       └── nodejs-tips.md
│   ├── pages/                  # 静态页面 → /{filename}
│   │   ├── about.md
│   │   └── contact.md
│   └── docs/                   # 文档页面 → /docs/{filename}
│       ├── guide/
│       │   └── getting-started.md
│       └── api.md
├── templates/                  # 模板目录
│   ├── layouts/               # 布局模板
│   │   ├── default.ejs
│   │   ├── post.ejs
│   │   ├── page.ejs
│   │   └── search.ejs
│   ├── partials/              # 组件模板
│   │   ├── header.ejs
│   │   ├── footer.ejs
│   │   ├── sidebar.ejs
│   │   ├── seo.ejs
│   │   └── search-box.ejs
│   └── themes/                # 主题模板
│       ├── default/
│       ├── minimal/
│       └── blog/
├── plugins/                    # 插件目录
│   ├── search/
│   ├── seo/
│   ├── rss/
│   └── analytics/
├── public/                     # 静态资源
│   ├── css/
│   ├── js/
│   │   └── search.js
│   ├── images/
│   └── fonts/
├── dist/                       # 构建输出目录
│   ├── api/                   # API 接口
│   │   ├── search.json
│   │   ├── posts.json
│   │   └── categories.json
│   ├── rss.xml
│   └── sitemap.xml
├── lib/                        # 核心库
│   ├── builder.js
│   ├── router.js
│   ├── template.js
│   ├── plugin.js
│   └── utils.js
├── site.config.js             # 站点配置
├── build.config.js            # 构建配置
├── plugins.config.js          # 插件配置
└── package.json
```

### 路由映射规则

| 文件路径 | 生成路由 | 说明 |
|---------|---------|------|
| `content/posts/hello.md` | `/post/hello` | 博客文章 |
| `content/pages/about.md` | `/about` | 静态页面 |
| `content/pages/index.md` | `/` | 首页内容 |
| `content/docs/api.md` | `/docs/api` | 文档页面 |
| `content/category/tech/ai.md` | `/category/tech/ai` | 嵌套目录 |

### 模板选择逻辑

1. **优先级**: Front Matter `template` 字段 > 目录默认模板 > 全局默认模板
2. **默认映射**:
   - `posts/` → `post.ejs`
   - `pages/` → `page.ejs`
   - 首页 → `index.ejs`
   - 其他 → `page.ejs`

### Front Matter 规范

```yaml
---
title: "文章标题"           # 必填
date: "2024-01-01"          # 发布日期
author: "作者名"            # 作者
category: "分类"            # 分类
tags: ["标签1", "标签2"]    # 标签数组
description: "页面描述"     # SEO 描述
template: "custom"          # 指定模板（可选）
draft: false                # 是否为草稿
---
```

## 🔧 技术栈

### 核心依赖
- **Node.js** - 运行环境
- **gray-matter** - Front Matter 解析
- **marked** - Markdown 转 HTML
- **ejs** - 模板引擎
- **fs-extra** - 文件系统操作
- **chokidar** - 文件监听
- **express** - 开发服务器（可选）

### 功能增强
- **moment** - 日期处理
- **highlight.js** - 代码高亮
- **katex** - 数学公式渲染
- **lunr** - 全文搜索
- **cheerio** - HTML 解析和 SEO 优化
- **sitemap** - Sitemap 生成
- **rss** - RSS 订阅生成

### 开发工具
- **nodemon** - 开发时自动重启
- **live-reload** - 浏览器自动刷新
- **commander** - CLI 命令行工具

## 🔍 搜索功能设计

### 搜索索引生成
```javascript
// 构建时生成搜索索引
{
  "posts": [
    {
      "id": "hello-world",
      "title": "Hello World",
      "content": "文章内容摘要...",
      "url": "/post/hello-world",
      "date": "2024-01-01",
      "tags": ["tech", "blog"],
      "category": "技术"
    }
  ],
  "pages": [...],
  "categories": [...],
  "tags": [...]
}
```

### 搜索 API 接口
- `/api/search.json` - 完整搜索索引
- `/api/posts.json` - 文章列表
- `/api/categories.json` - 分类列表
- `/api/tags.json` - 标签列表

## 📡 API 支持

### 静态 API 生成
```javascript
// 自动生成的 API 接口
const apiEndpoints = {
  search: '/api/search.json',
  posts: '/api/posts.json',
  categories: '/api/categories.json',
  tags: '/api/tags.json',
  recent: '/api/recent.json',
  archive: '/api/archive.json'
};
```

### API 数据结构
- **标准化响应格式**
- **分页支持**
- **过滤和排序**
- **缓存友好**

## 📰 RSS 订阅支持

### RSS 生成策略
- **全站 RSS**: `/rss.xml`
- **分类 RSS**: `/category/{name}/rss.xml`
- **标签 RSS**: `/tag/{name}/rss.xml`
- **自定义 RSS**: 支持自定义过滤条件

### RSS 配置
```javascript
rss: {
  title: '站点标题',
  description: '站点描述',
  language: 'zh-CN',
  ttl: 60,
  maxItems: 20,
  categories: ['tech', 'life'], // 生成分类RSS
  customFeeds: {
    'featured': { filter: post => post.featured },
    'recent': { limit: 10 }
  }
}
```

## 🎯 SEO 优化

### 多层级 SEO 支持

#### 1. 默认 SEO
```javascript
seo: {
  title: '默认标题',
  description: '默认描述',
  keywords: ['关键词1', '关键词2'],
  author: '作者名',
  ogImage: '/images/default-og.jpg'
}
```

#### 2. 目录级 SEO
```yaml
# content/posts/_meta.yml
title: "技术博客"
description: "分享技术心得和经验"
keywords: ["技术", "编程", "开发"]
```

#### 3. 单页面 SEO
```yaml
---
title: "具体文章标题"
description: "文章描述"
keywords: ["JavaScript", "Node.js"]
ogImage: "/images/article-cover.jpg"
canonical: "https://example.com/post/article"
---
```

#### 4. Sitemap 生成
- **自动生成 sitemap.xml**
- **支持优先级设置**
- **更新频率配置**
- **多语言支持**

## 👨‍💻 开发者友好性

### 1. 简单易用的 CLI
```bash
# 快速开始
npx create-static-blog my-blog
cd my-blog
npm run dev

# 构建命令
npm run build          # 完整构建
npm run build:quick    # 快速构建（跳过优化）
npm run build:watch    # 监听模式
npm run preview        # 预览构建结果
```

### 2. 热重载开发服务器
```javascript
// 开发模式特性
- 文件变更自动重新构建
- 浏览器自动刷新
- 错误提示和调试信息
- 模板语法高亮
```

### 3. 配置文件智能提示
```javascript
// site.config.js 支持 TypeScript 类型提示
/** @type {import('./types').SiteConfig} */
module.exports = {
  title: 'My Blog', // 智能提示和类型检查
  // ...
};
```

### 4. 模板开发工具
- **模板语法检查**
- **数据结构文档**
- **组件库支持**
- **样式预处理器集成**

## 🔧 简单页面开发

### 1. 零配置页面创建
```markdown
<!-- content/pages/about.md -->
---
title: "关于我们"
template: "page"
---

# 关于我们
这是关于页面的内容...
```

### 2. 自定义模板
```html
<!-- templates/layouts/custom.ejs -->
<!DOCTYPE html>
<html>
<head>
  <%- include('../partials/seo') %>
</head>
<body>
  <main>
    <%- content %>
  </main>
</body>
</html>
```

### 3. 组件化开发
```html
<!-- templates/partials/card.ejs -->
<div class="card">
  <h3><%= title %></h3>
  <p><%= description %></p>
  <% if (link) { %>
    <a href="<%= link %>">了解更多</a>
  <% } %>
</div>
```

## 🔌 二次开发支持

### 1. 插件系统
```javascript
// plugins/my-plugin.js
module.exports = {
  name: 'my-plugin',
  hooks: {
    'before:build': async (context) => {
      // 构建前处理
    },
    'after:render': async (html, data) => {
      // 渲染后处理
      return html;
    }
  }
};
```

### 2. 钩子系统
```javascript
// 可用钩子
const hooks = {
  'before:build': [],      // 构建开始前
  'after:scan': [],        // 文件扫描后
  'before:render': [],     // 渲染前
  'after:render': [],      // 渲染后
  'before:write': [],      // 写入文件前
  'after:build': [],       // 构建完成后
  'dev:reload': []         // 开发模式重载
};
```

### 3. 自定义处理器
```javascript
// 自定义 Markdown 处理器
module.exports = {
  processors: {
    markdown: {
      extensions: ['.md', '.markdown'],
      handler: async (content, frontMatter) => {
        // 自定义处理逻辑
        return processedContent;
      }
    }
  }
};
```

### 4. 主题系统
```javascript
// themes/my-theme/theme.config.js
module.exports = {
  name: 'my-theme',
  templates: './templates',
  assets: './assets',
  config: {
    colors: {
      primary: '#007acc',
      secondary: '#f0f0f0'
    }
  }
};
```

### 5. API 扩展
```javascript
// 扩展构建 API
const builder = require('./lib/builder');

// 自定义构建流程
builder.extend({
  async customStep(context) {
    // 自定义构建步骤
  }
});
```

## 🚀 实现计划

### 第一阶段：核心功能 (Week 1-2)
1. **基础架构搭建**
   - 项目结构设计
   - 核心库实现 (builder, router, template)
   - 配置系统

2. **内容处理**
   - Markdown 解析和 Front Matter 处理
   - 文件扫描和路由生成
   - 基础模板渲染

### 第二阶段：功能增强 (Week 3-4)
1. **搜索和 API**
   - 搜索索引生成
   - 静态 API 接口
   - 前端搜索实现

2. **SEO 和订阅**
   - 多层级 SEO 优化
   - RSS 订阅生成
   - Sitemap 自动生成

### 第三阶段：开发体验 (Week 5-6)
1. **开发工具**
   - CLI 命令行工具
   - 热重载开发服务器
   - 构建优化和缓存

2. **插件系统**
   - 钩子系统实现
   - 插件加载机制
   - 主题系统支持

## 📝 使用示例

### 1. 创建文章

```bash
# 在 content/posts/ 目录下创建 my-first-post.md
```

```markdown
---
title: "我的第一篇文章"
date: "2024-01-01"
author: "张三"
category: "技术"
tags: ["JavaScript", "Node.js"]
template: "post"
---

# 我的第一篇文章

这是文章内容...
```

### 2. 创建页面

```bash
# 在 content/pages/ 目录下创建 about.md
```

```markdown
---
title: "关于我们"
template: "page"
---

# 关于我们

这是关于页面的内容...
```

### 3. 构建站点

```bash
node build.js
```

### 4. 预览站点

```bash
node preview.js
```

## 🎨 设计原则

1. **约定优于配置**: 通过合理的默认设置减少配置需求
2. **文件即路由**: 文件结构直接映射为网站结构
3. **模板即样式**: 通过模板标识灵活控制页面样式
4. **内容与展示分离**: Markdown 专注内容，模板负责展示
5. **渐进增强**: 基础功能简单易用，高级功能可选配置

## 🔮 未来规划

- **插件系统**: 支持第三方插件扩展功能
- **主题系统**: 支持主题切换和自定义
- **多语言支持**: 国际化和本地化
- **图片优化**: 自动压缩和格式转换
- **搜索功能**: 全文搜索支持
- **评论系统**: 集成第三方评论服务

---

*这个项目的目标是创建一个真正简单、直观的静态博客生成器，让每个人都能轻松创建和维护自己的博客。*