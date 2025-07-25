const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const marked = require('marked');
const ejs = require('ejs');
const moment = require('moment');
const chokidar = require('chokidar');
const { EventEmitter } = require('events');

const Router = require('./router');
const Template = require('./template');
const Plugin = require('./plugin');
const Utils = require('./utils');

/**
 * 静态博客构建器
 */
class Builder extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = options;
    this.siteConfig = null;
    this.buildConfig = null;
    this.router = null;
    this.template = null;
    this.plugin = null;
    this.utils = new Utils();
    
    // 构建状态
    this.isBuilding = false;
    this.buildStartTime = null;
    this.cache = new Map();
    
    // 内容数据
    this.posts = [];
    this.pages = [];
    this.categories = new Map();
    this.tags = new Map();
    this.searchIndex = [];
  }

  /**
   * 初始化构建器
   */
  async init() {
    try {
      // 加载配置
      await this.loadConfig();
      
      // 初始化组件
      this.router = new Router(this.siteConfig);
      this.template = new Template(this.siteConfig, this.buildConfig);
      this.plugin = new Plugin(this.buildConfig.plugins || {});
      
      // 配置 marked
      this.configureMarked();
      
      // 加载插件
      await this.plugin.loadPlugins();
      
      this.emit('init:complete');
      this.utils.log('构建器初始化完成', 'info');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * 加载配置文件
   */
  async loadConfig() {
    const configPath = path.resolve(process.cwd(), 'site.config.js');
    const buildConfigPath = path.resolve(process.cwd(), 'build.config.js');
    
    if (await fs.pathExists(configPath)) {
      delete require.cache[configPath];
      this.siteConfig = require(configPath);
    } else {
      throw new Error('site.config.js 配置文件不存在');
    }
    
    if (await fs.pathExists(buildConfigPath)) {
      delete require.cache[buildConfigPath];
      this.buildConfig = require(buildConfigPath);
    } else {
      // 使用默认构建配置
      this.buildConfig = require('../build.config.js');
    }
  }

  /**
   * 配置 Marked
   */
  configureMarked() {
    const options = this.buildConfig.markdown?.options || {};
    
    marked.setOptions({
      breaks: options.breaks || true,
      gfm: true,
      ...options
    });
    
    // 配置代码高亮
    if (this.buildConfig.markdown?.highlight?.enabled) {
      const hljs = require('highlight.js');
      marked.setOptions({
        highlight: (code, lang) => {
          if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
          }
          return hljs.highlightAuto(code).value;
        }
      });
    }
  }

  /**
   * 扫描内容文件
   */
  async scanContent() {
    this.emit('scan:start');
    
    const contentPath = path.resolve(process.cwd(), this.siteConfig.paths.content);
    
    // 重置数据
    this.posts = [];
    this.pages = [];
    this.categories.clear();
    this.tags.clear();
    
    // 扫描各个目录
    for (const [routeName, routeConfig] of Object.entries(this.siteConfig.routes)) {
      const dirPath = path.join(contentPath, routeConfig.directory);
      
      if (await fs.pathExists(dirPath)) {
        await this.scanDirectory(dirPath, routeConfig, routeName);
      }
    }
    
    // 排序文章
    this.posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    this.emit('scan:complete', {
      posts: this.posts.length,
      pages: this.pages.length,
      categories: this.categories.size,
      tags: this.tags.size
    });
    
    this.utils.log(`扫描完成: ${this.posts.length} 篇文章, ${this.pages.length} 个页面`, 'info');
  }

  /**
   * 扫描目录
   */
  async scanDirectory(dirPath, routeConfig, routeName) {
    const files = await this.utils.getMarkdownFiles(dirPath);
    
    for (const filePath of files) {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        const { data: frontMatter, content: markdownContent } = matter(content);
        
        // 生成路由
        const route = this.router.generateRoute(filePath, routeConfig, frontMatter);
        
        // 处理内容
        const htmlContent = marked.parse ? marked.parse(markdownContent) : marked(markdownContent);
        
        // 创建文档对象
        const doc = {
          ...frontMatter,
          content: htmlContent,
          rawContent: markdownContent,
          route,
          filePath,
          routeName,
          template: frontMatter.template || routeConfig.template,
          date: frontMatter.date || await this.utils.getFileDate(filePath),
          slug: this.utils.getSlug(filePath),
          excerpt: this.utils.getExcerpt(markdownContent, frontMatter.excerpt)
        };
        
        // 分类存储
        if (routeName === 'posts') {
          this.posts.push(doc);
          
          // 处理分类和标签
          this.processCategories(doc);
          this.processTags(doc);
        } else {
          this.pages.push(doc);
        }
        
      } catch (error) {
        this.utils.log(`处理文件失败: ${filePath} - ${error.message}`, 'error');
      }
    }
  }

  /**
   * 处理分类
   */
  processCategories(doc) {
    if (doc.category) {
      const categories = Array.isArray(doc.category) ? doc.category : [doc.category];
      
      categories.forEach(cat => {
        if (!this.categories.has(cat)) {
          this.categories.set(cat, []);
        }
        this.categories.get(cat).push(doc);
      });
    }
  }

  /**
   * 处理标签
   */
  processTags(doc) {
    if (doc.tags) {
      const tags = Array.isArray(doc.tags) ? doc.tags : [doc.tags];
      
      tags.forEach(tag => {
        if (!this.tags.has(tag)) {
          this.tags.set(tag, []);
        }
        this.tags.get(tag).push(doc);
      });
    }
  }

  /**
   * 构建站点
   */
  async build(options = {}) {
    if (this.isBuilding) {
      throw new Error('构建正在进行中');
    }
    
    this.isBuilding = true;
    this.buildStartTime = Date.now();
    
    try {
      this.emit('build:start');
      
      // 初始化构建器（如果还未初始化）
      if (!this.plugin) {
        await this.init();
      }
      
      // 执行构建前钩子
      await this.plugin.executeHook('before:build', { builder: this, options });
      
      // 清理输出目录
      if (this.buildConfig.output.clean) {
        await this.cleanOutput();
      }
      
      // 扫描内容
      await this.scanContent();
      
      // 执行扫描后钩子
      await this.plugin.executeHook('after:scan', { builder: this });
      
      // 生成页面
      await this.generatePages();
      
      // 生成API
      if (this.buildConfig.generate.files.api) {
        await this.generateAPI();
      }
      
      // 生成RSS
      if (this.buildConfig.generate.files.rss) {
        await this.generateRSS();
      }
      
      // 生成Sitemap
      if (this.buildConfig.generate.files.sitemap) {
        await this.generateSitemap();
      }
      
      // 复制静态资源
      await this.copyAssets();
      
      // 执行构建后钩子
      await this.plugin.executeHook('after:build', { builder: this });
      
      const buildTime = Date.now() - this.buildStartTime;
      this.emit('build:complete', { buildTime });
      this.utils.log(`构建完成，耗时 ${buildTime}ms`, 'info');
      
    } catch (error) {
      this.emit('build:error', error);
      throw error;
    } finally {
      this.isBuilding = false;
    }
  }

  /**
   * 清理输出目录
   */
  async cleanOutput() {
    const outputPath = path.resolve(process.cwd(), this.buildConfig.output.path);
    await fs.emptyDir(outputPath);
    this.utils.log('输出目录已清理', 'info');
  }

  /**
   * 生成页面
   */
  async generatePages() {
    this.emit('generate:start');
    
    // 生成首页
    await this.generateHomePage();
    
    // 生成文章页面
    for (const post of this.posts) {
      await this.generatePage(post);
    }
    
    // 生成普通页面
    for (const page of this.pages) {
      await this.generatePage(page);
    }
    
    // 生成分类页面
    for (const [category, posts] of this.categories) {
      await this.generateCategoryPage(category, posts);
    }
    
    // 生成标签页面
    for (const [tag, posts] of this.tags) {
      await this.generateTagPage(tag, posts);
    }
    
    this.emit('generate:complete');
  }

  /**
   * 生成首页
   */
  async generateHomePage() {
    const templateData = {
      site: this.siteConfig,
      posts: this.posts.slice(0, this.siteConfig.pagination.perPage),
      pages: this.pages,
      categories: Array.from(this.categories.keys()),
      tags: Array.from(this.tags.keys()),
      pagination: {
        current: 1,
        total: Math.ceil(this.posts.length / this.siteConfig.pagination.perPage),
        hasNext: this.posts.length > this.siteConfig.pagination.perPage,
        hasPrev: false
      }
    };
    
    const html = await this.template.render('index', templateData);
    const outputPath = path.join(this.buildConfig.output.path, 'index.html');
    
    await this.writeFile(outputPath, html);
  }

  /**
   * 生成单个页面
   */
  async generatePage(doc) {
    const templateData = {
      site: this.siteConfig,
      page: doc,
      posts: this.posts,
      categories: Array.from(this.categories.keys()),
      tags: Array.from(this.tags.keys())
    };
    
    // 执行渲染前钩子
    await this.plugin.executeHook('before:render', { doc, templateData });
    
    const html = await this.template.render(doc.template, templateData);
    
    // 执行渲染后钩子
    const processedHtml = await this.plugin.executeHook('after:render', html, { doc, templateData });
    
    const outputPath = path.join(this.buildConfig.output.path, doc.route, 'index.html');
    await this.writeFile(outputPath, processedHtml || html);
  }

  /**
   * 生成分类页面
   */
  async generateCategoryPage(category, posts) {
    const templateData = {
      site: this.siteConfig,
      category,
      posts,
      pagination: {
        current: 1,
        total: 1,
        hasNext: false,
        hasPrev: false
      }
    };
    
    const html = await this.template.render('category', templateData);
    const outputPath = path.join(this.buildConfig.output.path, 'category', category, 'index.html');
    
    await this.writeFile(outputPath, html);
  }

  /**
   * 生成标签页面
   */
  async generateTagPage(tag, posts) {
    const templateData = {
      site: this.siteConfig,
      tag,
      posts,
      pagination: {
        current: 1,
        total: 1,
        hasNext: false,
        hasPrev: false
      }
    };
    
    const html = await this.template.render('tag', templateData);
    const outputPath = path.join(this.buildConfig.output.path, 'tag', tag, 'index.html');
    
    await this.writeFile(outputPath, html);
  }

  /**
   * 生成API接口
   */
  async generateAPI() {
    const apiPath = path.join(this.buildConfig.output.path, this.buildConfig.output.api);
    
    // 生成搜索索引
    const searchIndex = {
      posts: this.posts.map(post => ({
        id: post.slug,
        title: post.title,
        content: this.utils.stripHtml(post.content).substring(0, 200),
        url: post.route,
        date: post.date,
        tags: post.tags || [],
        category: post.category || ''
      })),
      pages: this.pages.map(page => ({
        id: page.slug,
        title: page.title,
        content: this.utils.stripHtml(page.content).substring(0, 200),
        url: page.route
      })),
      categories: Array.from(this.categories.keys()),
      tags: Array.from(this.tags.keys())
    };
    
    await this.writeFile(path.join(apiPath, 'search.json'), JSON.stringify(searchIndex, null, 2));
    await this.writeFile(path.join(apiPath, 'posts.json'), JSON.stringify(this.posts, null, 2));
    await this.writeFile(path.join(apiPath, 'categories.json'), JSON.stringify(Array.from(this.categories.entries()), null, 2));
    await this.writeFile(path.join(apiPath, 'tags.json'), JSON.stringify(Array.from(this.tags.entries()), null, 2));
  }

  /**
   * 生成RSS
   */
  async generateRSS() {
    const RSS = require('rss');
    
    const feed = new RSS({
      title: this.siteConfig.rss.title,
      description: this.siteConfig.rss.description,
      feed_url: `${this.siteConfig.url}/rss.xml`,
      site_url: this.siteConfig.url,
      language: this.siteConfig.rss.language,
      ttl: this.siteConfig.rss.ttl
    });
    
    const recentPosts = this.posts.slice(0, this.siteConfig.rss.maxItems);
    
    recentPosts.forEach(post => {
      feed.item({
        title: post.title,
        description: post.excerpt || this.utils.stripHtml(post.content).substring(0, 200),
        url: `${this.siteConfig.url}${post.route}`,
        date: post.date,
        categories: post.tags || []
      });
    });
    
    const rssXml = feed.xml();
    const outputPath = path.join(this.buildConfig.output.path, 'rss.xml');
    
    await this.writeFile(outputPath, rssXml);
  }

  /**
   * 生成Sitemap
   */
  async generateSitemap() {
    const { SitemapStream, streamToPromise } = require('sitemap');
    const { Readable } = require('stream');
    
    const links = [
      { url: '/', changefreq: 'daily', priority: 1.0 },
      ...this.posts.map(post => ({
        url: post.route,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: post.date
      })),
      ...this.pages.map(page => ({
        url: page.route,
        changefreq: 'monthly',
        priority: 0.6
      }))
    ];
    
    const stream = new SitemapStream({ hostname: this.siteConfig.url });
    const sitemap = await streamToPromise(Readable.from(links).pipe(stream));
    
    const outputPath = path.join(this.buildConfig.output.path, 'sitemap.xml');
    await this.writeFile(outputPath, sitemap.toString());
  }

  /**
   * 复制静态资源
   */
  async copyAssets() {
    const publicPath = path.resolve(process.cwd(), this.siteConfig.paths.public);
    const outputPath = path.resolve(process.cwd(), this.buildConfig.output.path);
    
    if (await fs.pathExists(publicPath)) {
      await fs.copy(publicPath, outputPath, {
        filter: (src) => {
          // 过滤不需要的文件
          const ignored = this.buildConfig.assets.ignore || [];
          return !ignored.some(pattern => src.includes(pattern));
        }
      });
      
      this.utils.log('静态资源复制完成', 'info');
    }
  }

  /**
   * 写入文件
   */
  async writeFile(filePath, content) {
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * 监听文件变化
   */
  watch() {
    const watchPaths = [
      this.siteConfig.paths.content,
      this.siteConfig.paths.templates,
      this.siteConfig.paths.public,
      'site.config.js',
      'build.config.js'
    ];
    
    const watcher = chokidar.watch(watchPaths, {
      ignored: /node_modules/,
      persistent: true
    });
    
    watcher.on('change', async (filePath) => {
      this.utils.log(`文件变化: ${filePath}`, 'info');
      
      try {
        if (filePath.endsWith('.config.js')) {
          await this.loadConfig();
        }
        
        await this.build();
        this.emit('dev:reload');
      } catch (error) {
        this.utils.log(`重新构建失败: ${error.message}`, 'error');
      }
    });
    
    return watcher;
  }

  /**
   * 扩展构建器
   */
  extend(extensions) {
    Object.assign(this, extensions);
  }
}

module.exports = Builder;