#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');
const inquirer = require('inquirer');
const Builder = require('../lib/builder');
const DevServer = require('../lib/dev-server');
const Utils = require('../lib/utils');

const utils = new Utils();
const program = new Command();

// 版本信息
const packageJson = require('../package.json');
program.version(packageJson.version, '-v, --version', '显示版本号');

/**
 * 初始化项目命令
 */
program
  .command('init [name]')
  .description('初始化新的静态博客项目')
  .option('-t, --template <template>', '使用指定模板', 'default')
  .option('-f, --force', '强制覆盖已存在的目录')
  .action(async (name, options) => {
    try {
      await initProject(name, options);
    } catch (error) {
      console.error(chalk.red('初始化失败:'), error.message);
      process.exit(1);
    }
  });

/**
 * 构建命令
 */
program
  .command('build')
  .description('构建静态站点')
  .option('-c, --config <config>', '指定配置文件路径')
  .option('-o, --output <output>', '指定输出目录')
  .option('--clean', '构建前清理输出目录')
  .option('--watch', '监听文件变化并自动重建')
  .option('--verbose', '显示详细日志')
  .action(async (options) => {
    try {
      await buildSite(options);
    } catch (error) {
      console.error(chalk.red('构建失败:'), error.message);
      process.exit(1);
    }
  });

/**
 * 开发服务器命令
 */
program
  .command('dev')
  .description('启动开发服务器')
  .option('-p, --port <port>', '指定端口号', '3000')
  .option('-h, --host <host>', '指定主机地址', 'localhost')
  .option('--no-open', '不自动打开浏览器')
  .option('--no-livereload', '禁用实时重载')
  .option('-c, --config <config>', '指定配置文件路径')
  .option('--verbose', '显示详细日志')
  .action(async (options) => {
    try {
      await startDevServer(options);
    } catch (error) {
      console.error(chalk.red('开发服务器启动失败:'), error.message);
      process.exit(1);
    }
  });

/**
 * 预览命令
 */
program
  .command('preview')
  .description('预览构建后的站点')
  .option('-p, --port <port>', '指定端口号', '4000')
  .option('-h, --host <host>', '指定主机地址', 'localhost')
  .option('--no-open', '不自动打开浏览器')
  .option('-d, --dir <dir>', '指定预览目录', 'dist')
  .action(async (options) => {
    try {
      await previewSite(options);
    } catch (error) {
      console.error(chalk.red('预览失败:'), error.message);
      process.exit(1);
    }
  });

/**
 * 清理命令
 */
program
  .command('clean')
  .description('清理构建输出和缓存')
  .option('-o, --output <output>', '指定输出目录')
  .option('--cache', '同时清理缓存')
  .action(async (options) => {
    try {
      await cleanSite(options);
    } catch (error) {
      console.error(chalk.red('清理失败:'), error.message);
      process.exit(1);
    }
  });

/**
 * 新建内容命令
 */
program
  .command('new <type> <title>')
  .description('创建新的内容文件')
  .option('-t, --template <template>', '使用指定模板')
  .option('-c, --category <category>', '指定分类')
  .option('--tags <tags>', '指定标签（逗号分隔）')
  .action(async (type, title, options) => {
    try {
      await createContent(type, title, options);
    } catch (error) {
      console.error(chalk.red('创建内容失败:'), error.message);
      process.exit(1);
    }
  });

/**
 * 部署命令
 */
program
  .command('deploy')
  .description('部署站点到远程服务器')
  .option('-t, --target <target>', '部署目标', 'default')
  .option('--dry-run', '模拟部署（不实际执行）')
  .action(async (options) => {
    try {
      await deploySite(options);
    } catch (error) {
      console.error(chalk.red('部署失败:'), error.message);
      process.exit(1);
    }
  });

/**
 * 初始化项目
 */
async function initProject(name, options) {
  const projectName = name || await askProjectName();
  const projectPath = path.resolve(process.cwd(), projectName);
  
  // 检查目录是否存在
  if (await fs.pathExists(projectPath) && !options.force) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `目录 ${projectName} 已存在，是否覆盖？`,
        default: false
      }
    ]);
    
    if (!overwrite) {
      console.log(chalk.yellow('已取消初始化'));
      return;
    }
  }
  
  console.log(chalk.blue(`正在初始化项目: ${projectName}`));
  
  // 创建项目目录
  await fs.ensureDir(projectPath);
  
  // 复制模板文件
  await copyTemplate(options.template, projectPath);
  
  // 创建配置文件
  await createConfigFiles(projectPath, projectName);
  
  // 创建示例内容
  await createSampleContent(projectPath);
  
  console.log(chalk.green('✅ 项目初始化完成！'));
  console.log('');
  console.log('下一步：');
  console.log(chalk.cyan(`  cd ${projectName}`));
  console.log(chalk.cyan('  npm install'));
  console.log(chalk.cyan('  npm run dev'));
}

/**
 * 构建站点
 */
async function buildSite(options) {
  console.log(chalk.blue('🔨 开始构建站点...'));
  
  // 设置日志级别
  if (options.verbose) {
    process.env.LOG_LEVEL = 'debug';
  }
  
  // 创建构建器
  const builderConfig = {};
  
  if (options.config) {
    builderConfig.configPath = path.resolve(options.config);
  }
  
  if (options.output) {
    builderConfig.outputDir = path.resolve(options.output);
  }
  
  const builder = new Builder(builderConfig);
  await builder.init();
  
  // 清理输出目录
  if (options.clean) {
    await builder.clean();
  }
  
  const startTime = Date.now();
  
  if (options.watch) {
    // 监听模式
    console.log(chalk.yellow('👀 监听文件变化中...'));
    await builder.watch();
  } else {
    // 单次构建
    await builder.build();
    
    const buildTime = Date.now() - startTime;
    console.log(chalk.green(`✅ 构建完成！用时 ${buildTime}ms`));
  }
}

/**
 * 启动开发服务器
 */
async function startDevServer(options) {
  console.log(chalk.blue('🚀 启动开发服务器...'));
  
  // 设置日志级别
  if (options.verbose) {
    process.env.LOG_LEVEL = 'debug';
  }
  
  // 创建开发服务器配置
  const serverConfig = {
    port: parseInt(options.port),
    host: options.host,
    open: options.open,
    livereload: options.livereload
  };
  
  // 构建器配置
  const builderConfig = {};
  if (options.config) {
    builderConfig.configPath = path.resolve(options.config);
  }
  
  const devServer = new DevServer(serverConfig);
  
  // 处理退出信号
  process.on('SIGINT', async () => {
    console.log(chalk.yellow('\n正在停止开发服务器...'));
    await devServer.stop();
    process.exit(0);
  });
  
  await devServer.start(builderConfig);
}

/**
 * 预览站点
 */
async function previewSite(options) {
  const express = require('express');
  const app = express();
  
  const previewDir = path.resolve(options.dir);
  
  if (!(await fs.pathExists(previewDir))) {
    throw new Error(`预览目录不存在: ${previewDir}`);
  }
  
  app.use(express.static(previewDir));
  
  // SPA回退
  app.get('*', (req, res) => {
    const indexPath = path.join(previewDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Page not found');
    }
  });
  
  const server = app.listen(options.port, options.host, () => {
    const url = `http://${options.host}:${options.port}`;
    console.log(chalk.green(`📱 预览服务器已启动: ${url}`));
    
    if (options.open) {
      import('open').then(({ default: open }) => {
        open(url);
      });
    }
  });
  
  // 处理退出信号
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n正在停止预览服务器...'));
    server.close(() => {
      console.log(chalk.green('预览服务器已停止'));
      process.exit(0);
    });
  });
}

/**
 * 清理站点
 */
async function cleanSite(options) {
  console.log(chalk.blue('🧹 清理站点...'));
  
  const builder = new Builder();
  await builder.init();
  
  if (options.output) {
    const outputDir = path.resolve(options.output);
    if (await fs.pathExists(outputDir)) {
      await fs.remove(outputDir);
      console.log(chalk.green(`✅ 已清理输出目录: ${outputDir}`));
    }
  } else {
    await builder.clean();
  }
  
  if (options.cache) {
    builder.clearCache();
    console.log(chalk.green('✅ 已清理缓存'));
  }
  
  console.log(chalk.green('✅ 清理完成！'));
}

/**
 * 创建新内容
 */
async function createContent(type, title, options) {
  const validTypes = ['post', 'page', 'doc'];
  
  if (!validTypes.includes(type)) {
    throw new Error(`无效的内容类型: ${type}。支持的类型: ${validTypes.join(', ')}`);
  }
  
  const slug = utils.slugify(title);
  const date = new Date();
  
  // 确定文件路径
  let filePath;
  switch (type) {
    case 'post':
      const dateStr = utils.formatDate(date, 'YYYY-MM-DD');
      filePath = path.join('content', 'posts', `${dateStr}-${slug}.md`);
      break;
    case 'page':
      filePath = path.join('content', 'pages', `${slug}.md`);
      break;
    case 'doc':
      filePath = path.join('content', 'docs', `${slug}.md`);
      break;
  }
  
  // 检查文件是否已存在
  if (await fs.pathExists(filePath)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `文件 ${filePath} 已存在，是否覆盖？`,
        default: false
      }
    ]);
    
    if (!overwrite) {
      console.log(chalk.yellow('已取消创建'));
      return;
    }
  }
  
  // 生成Front Matter
  const frontMatter = {
    title,
    date: date.toISOString(),
    slug
  };
  
  if (options.category) {
    frontMatter.categories = [options.category];
  }
  
  if (options.tags) {
    frontMatter.tags = options.tags.split(',').map(tag => tag.trim());
  }
  
  if (type === 'post') {
    frontMatter.draft = false;
  }
  
  // 生成文件内容
  const yamlFrontMatter = Object.entries(frontMatter)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
      }
      return `${key}: ${value}`;
    })
    .join('\n');
  
  const content = `---
${yamlFrontMatter}
---

# ${title}

在这里编写你的内容...
`;
  
  // 创建文件
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf8');
  
  console.log(chalk.green(`✅ 已创建 ${type}: ${filePath}`));
}

/**
 * 部署站点
 */
async function deploySite(options) {
  console.log(chalk.blue('🚀 部署站点...'));
  
  // 这里可以集成各种部署方式
  // 例如：GitHub Pages, Netlify, Vercel 等
  
  console.log(chalk.yellow('部署功能正在开发中...'));
  console.log('你可以手动将 dist 目录的内容上传到你的服务器');
}

/**
 * 询问项目名称
 */
async function askProjectName() {
  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: '请输入项目名称:',
      default: 'my-blog',
      validate: (input) => {
        if (!input.trim()) {
          return '项目名称不能为空';
        }
        if (!/^[a-zA-Z0-9-_]+$/.test(input)) {
          return '项目名称只能包含字母、数字、连字符和下划线';
        }
        return true;
      }
    }
  ]);
  
  return name;
}

/**
 * 复制模板文件
 */
async function copyTemplate(template, projectPath) {
  const templatePath = path.join(__dirname, '..', 'templates', template);
  
  if (await fs.pathExists(templatePath)) {
    await fs.copy(templatePath, projectPath);
  } else {
    // 使用默认模板结构
    await createDefaultTemplate(projectPath);
  }
}

/**
 * 创建默认模板
 */
async function createDefaultTemplate(projectPath) {
  const dirs = [
    'content/posts',
    'content/pages',
    'content/docs',
    'templates',
    'public/images',
    'public/css',
    'public/js'
  ];
  
  for (const dir of dirs) {
    await fs.ensureDir(path.join(projectPath, dir));
  }
  
  // 创建基础模板文件
  const templates = {
    'templates/layout.ejs': getLayoutTemplate(),
    'templates/post.ejs': getPostTemplate(),
    'templates/page.ejs': getPageTemplate(),
    'templates/index.ejs': getIndexTemplate()
  };
  
  for (const [filePath, content] of Object.entries(templates)) {
    await fs.writeFile(path.join(projectPath, filePath), content, 'utf8');
  }
}

/**
 * 创建配置文件
 */
async function createConfigFiles(projectPath, projectName) {
  // site.config.js
  const siteConfig = `module.exports = {
  site: {
    title: '${projectName}',
    description: '一个使用 Static Blog Generator 构建的博客',
    author: 'Your Name',
    url: 'https://your-domain.com',
    language: 'zh-CN'
  },
  
  build: {
    content: 'content',
    output: 'dist',
    templates: 'templates',
    public: 'public'
  },
  
  routes: {
    posts: {
      pattern: '/posts/:slug',
      template: 'post'
    },
    pages: {
      pattern: '/:slug',
      template: 'page'
    },
    docs: {
      pattern: '/docs/:slug',
      template: 'doc'
    }
  },
  
  pagination: {
    enabled: true,
    perPage: 10
  },
  
  seo: {
    enabled: true
  },
  
  rss: {
    enabled: true,
    title: '${projectName}',
    description: '最新文章'
  },
  
  search: {
    enabled: true
  }
};
`;
  
  await fs.writeFile(path.join(projectPath, 'site.config.js'), siteConfig, 'utf8');
  
  // package.json
  const packageJson = {
    name: utils.slugify(projectName),
    version: '1.0.0',
    description: `${projectName} - 静态博客`,
    scripts: {
      dev: 'static-blog dev',
      build: 'static-blog build',
      preview: 'static-blog preview',
      clean: 'static-blog clean'
    },
    dependencies: {
      'static-blog-generator': '^1.0.0'
    }
  };
  
  await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });
}

/**
 * 创建示例内容
 */
async function createSampleContent(projectPath) {
  // 示例文章
  const samplePost = `---
title: 欢迎使用 Static Blog Generator
date: ${new Date().toISOString()}
slug: welcome
categories:
  - 教程
tags:
  - 开始
  - 博客
draft: false
---

# 欢迎使用 Static Blog Generator

这是你的第一篇文章！

## 特性

- 🚀 快速构建
- 📱 响应式设计
- 🔍 内置搜索
- 📊 SEO 优化
- 🔥 热重载开发

## 开始写作

你可以使用以下命令创建新文章：

\`\`\`bash
npm run new post "文章标题"
\`\`\`

祝你写作愉快！
`;
  
  await fs.writeFile(
    path.join(projectPath, 'content/posts/welcome.md'),
    samplePost,
    'utf8'
  );
  
  // 示例页面
  const samplePage = `---
title: 关于
slug: about
---

# 关于我们

这是一个关于页面的示例。

你可以在这里介绍你自己或你的博客。
`;
  
  await fs.writeFile(
    path.join(projectPath, 'content/pages/about.md'),
    samplePage,
    'utf8'
  );
}

/**
 * 获取模板内容
 */
function getLayoutTemplate() {
  return `<!DOCTYPE html>
<html lang="<%= site.language || 'zh-CN' %>">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><% if (title) { %><%= title %> - <% } %><%= site.title %></title>
  <meta name="description" content="<%= description || site.description %>">
  <link rel="stylesheet" href="/css/style.css">
</head>
<body>
  <header>
    <nav>
      <h1><a href="/"><%= site.title %></a></h1>
      <ul>
        <li><a href="/">首页</a></li>
        <li><a href="/about">关于</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <%- body %>
  </main>
  
  <footer>
    <p>&copy; <%= new Date().getFullYear() %> <%= site.author %>. All rights reserved.</p>
  </footer>
</body>
</html>
`;
}

function getPostTemplate() {
  return `<% layout('layout') %>

<article class="post">
  <header>
    <h1><%= title %></h1>
    <div class="meta">
      <time datetime="<%= date %>"><%= formatDate(date) %></time>
      <% if (categories && categories.length) { %>
        <span class="categories">
          <% categories.forEach(cat => { %>
            <a href="/categories/<%= slugify(cat) %>"><%= cat %></a>
          <% }) %>
        </span>
      <% } %>
    </div>
  </header>
  
  <div class="content">
    <%- content %>
  </div>
  
  <% if (tags && tags.length) { %>
    <footer class="tags">
      <% tags.forEach(tag => { %>
        <a href="/tags/<%= slugify(tag) %>" class="tag"><%= tag %></a>
      <% }) %>
    </footer>
  <% } %>
</article>
`;
}

function getPageTemplate() {
  return `<% layout('layout') %>

<article class="page">
  <header>
    <h1><%= title %></h1>
  </header>
  
  <div class="content">
    <%- content %>
  </div>
</article>
`;
}

function getIndexTemplate() {
  return `<% layout('layout') %>

<div class="home">
  <section class="posts">
    <h2>最新文章</h2>
    <% if (posts && posts.length) { %>
      <% posts.forEach(post => { %>
        <article class="post-preview">
          <h3><a href="<%= post.url %>"><%= post.title %></a></h3>
          <div class="meta">
            <time datetime="<%= post.date %>"><%= formatDate(post.date) %></time>
          </div>
          <div class="excerpt">
            <%= post.excerpt %>
          </div>
        </article>
      <% }) %>
    <% } else { %>
      <p>暂无文章</p>
    <% } %>
  </section>
</div>
`;
}

// 解析命令行参数
program.parse(process.argv);

// 如果没有提供命令，显示帮助
if (!process.argv.slice(2).length) {
  program.outputHelp();
}