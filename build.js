#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { marked } = require('marked');
const matter = require('gray-matter');
const ejs = require('ejs');
const config = require('./config');

/**
 * 企业级静态网站生成器
 * 支持大型项目和知识库的高性能构建系统
 */
class StaticSiteGenerator {
  constructor() {
    this.config = config;
    this.startTime = Date.now();
    this.stats = {
      pages: 0,
      posts: 0,
      assets: 0,
      errors: 0
    };
    this.cache = new Map();
    this.templates = new Map();
    this.plugins = [];
  }

  /**
   * 主构建流程
   */
  async build() {
    try {
      console.log(chalk.blue('🚀 开始构建静态网站...'));
      
      // 1. 清理输出目录
      await this.clean();
      
      // 2. 创建目录结构
      await this.createDirectories();
      
      // 3. 加载模板
      await this.loadTemplates();
      
      // 4. 加载插件
      await this.loadPlugins();
      
      // 5. 处理静态资源
      await this.copyAssets();
      
      // 6. 处理内容文件
      await this.processContent();
      
      // 7. 生成索引页面
      await this.generateIndexPages();
      
      // 8. 生成特殊页面
      await this.generateSpecialPages();
      
      // 9. 运行插件后处理
      await this.runPostProcessPlugins();
      
      // 10. 生成统计报告
      this.generateReport();
      
    } catch (error) {
      console.error(chalk.red('❌ 构建失败:'), error.message);
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  /**
   * 清理输出目录
   */
  async clean() {
    const outputDir = this.config.dirs.output;
    if (await fs.pathExists(outputDir)) {
      await fs.remove(outputDir);
      console.log(chalk.yellow(`🧹 已清理输出目录: ${outputDir}`));
    }
  }

  /**
   * 创建目录结构
   */
  async createDirectories() {
    const dirs = [
      this.config.dirs.output,
      path.join(this.config.dirs.output, 'assets'),
      path.join(this.config.dirs.output, 'posts'),
      path.join(this.config.dirs.output, 'pages'),
      path.join(this.config.dirs.output, 'api')
    ];
    
    for (const dir of dirs) {
      await fs.ensureDir(dir);
    }
  }

  /**
   * 加载模板文件
   */
  async loadTemplates() {
    const templatesDir = this.config.dirs.templates;
    
    if (!(await fs.pathExists(templatesDir))) {
      throw new Error(`模板目录不存在: ${templatesDir}`);
    }
    
    const templateFiles = await this.getFiles(templatesDir, '.ejs');
    
    for (const file of templateFiles) {
      const content = await fs.readFile(file, 'utf8');
      const name = path.basename(file, '.ejs');
      this.templates.set(name, content);
    }
    
    console.log(chalk.green(`📄 已加载 ${templateFiles.length} 个模板`));
  }

  /**
   * 加载插件
   */
  async loadPlugins() {
    const pluginsDir = 'plugins';
    
    if (await fs.pathExists(pluginsDir)) {
      const pluginFiles = await this.getFiles(pluginsDir, '.js');
      
      for (const file of pluginFiles) {
        try {
          const plugin = require(path.resolve(file));
          if (typeof plugin === 'function') {
            this.plugins.push(plugin);
          }
        } catch (error) {
          console.warn(chalk.yellow(`⚠️  插件加载失败: ${file}`));
        }
      }
      
      console.log(chalk.green(`🔌 已加载 ${this.plugins.length} 个插件`));
    }
  }

  /**
   * 复制静态资源
   */
  async copyAssets() {
    const staticDir = this.config.dirs.static;
    const outputAssetsDir = path.join(this.config.dirs.output, 'assets');
    
    if (await fs.pathExists(staticDir)) {
      await fs.copy(staticDir, outputAssetsDir);
      const files = await this.getFiles(staticDir);
      this.stats.assets = files.length;
      console.log(chalk.green(`📦 已复制 ${files.length} 个静态资源`));
    }
  }

  /**
   * 处理内容文件
   */
  async processContent() {
    const contentDir = this.config.dirs.content;
    
    if (!(await fs.pathExists(contentDir))) {
      throw new Error(`内容目录不存在: ${contentDir}`);
    }
    
    // 处理文章
    await this.processPosts();
    
    // 处理页面
    await this.processPages();
  }

  /**
   * 处理文章
   */
  async processPosts() {
    const postsDir = path.join(this.config.dirs.content, 'posts');
    
    if (await fs.pathExists(postsDir)) {
      const postFiles = await this.getFiles(postsDir, '.md');
      
      for (const file of postFiles) {
        await this.processPost(file);
        this.stats.posts++;
      }
      
      console.log(chalk.green(`📝 已处理 ${postFiles.length} 篇文章`));
    }
  }

  /**
   * 处理单篇文章
   */
  async processPost(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const { data: frontMatter, content: markdown } = matter(content);
    
    // 生成HTML内容
    const html = marked(markdown);
    
    // 生成文章数据
    const post = {
      ...frontMatter,
      content: html,
      slug: frontMatter.slug || this.generateSlug(path.basename(filePath, '.md')),
      date: frontMatter.date || new Date(),
      url: `/posts/${frontMatter.slug || this.generateSlug(path.basename(filePath, '.md'))}/`
    };
    
    // 渲染文章页面
    const templateContent = this.templates.get('post') || this.templates.get('default');
    if (!templateContent) {
      throw new Error('找不到文章模板');
    }
    
    const pageHtml = ejs.render(templateContent, {
      site: this.config.site,
      post,
      nav: this.config.nav
    });
    
    // 写入文件
    const outputPath = path.join(this.config.dirs.output, 'posts', post.slug, 'index.html');
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, pageHtml);
  }

  /**
   * 处理页面
   */
  async processPages() {
    const pagesDir = path.join(this.config.dirs.content, 'pages');
    
    if (await fs.pathExists(pagesDir)) {
      const pageFiles = await this.getFiles(pagesDir, '.md');
      
      for (const file of pageFiles) {
        await this.processPage(file);
        this.stats.pages++;
      }
      
      console.log(chalk.green(`📄 已处理 ${pageFiles.length} 个页面`));
    }
  }

  /**
   * 处理单个页面
   */
  async processPage(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const { data: frontMatter, content: markdown } = matter(content);
    
    const html = marked(markdown);
    const slug = frontMatter.slug || this.generateSlug(path.basename(filePath, '.md'));
    
    const page = {
      ...frontMatter,
      content: html,
      slug,
      url: `/${slug}/`
    };
    
    const templateContent = this.templates.get('page') || this.templates.get('default');
    if (!templateContent) {
      throw new Error('找不到页面模板');
    }
    
    const pageHtml = ejs.render(templateContent, {
      site: this.config.site,
      page,
      nav: this.config.nav
    });
    
    const outputPath = path.join(this.config.dirs.output, slug, 'index.html');
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, pageHtml);
  }

  /**
   * 生成索引页面
   */
  async generateIndexPages() {
    // 获取所有文章
    const posts = await this.getAllPosts();
    
    // 生成首页
    await this.generateHomePage(posts);
    
    // 生成文章列表页
    await this.generatePostsIndex(posts);
  }

  /**
   * 生成首页
   */
  async generateHomePage(posts) {
    const templateContent = this.templates.get('index') || this.templates.get('default');
    if (!templateContent) {
      throw new Error('找不到首页模板');
    }
    
    const recentPosts = posts.slice(0, this.config.pages.postsPerPage);
    
    const html = ejs.render(templateContent, {
      site: this.config.site,
      posts: recentPosts,
      nav: this.config.nav
    });
    
    await fs.writeFile(path.join(this.config.dirs.output, 'index.html'), html);
  }

  /**
   * 生成文章列表页
   */
  async generatePostsIndex(posts) {
    const templateContent = this.templates.get('posts') || this.templates.get('default');
    if (!templateContent) {
      return;
    }
    
    const html = ejs.render(templateContent, {
      site: this.config.site,
      posts,
      nav: this.config.nav
    });
    
    const outputPath = path.join(this.config.dirs.output, 'posts', 'index.html');
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, html);
  }

  /**
   * 生成特殊页面
   */
  async generateSpecialPages() {
    // 生成sitemap
    if (this.config.build.generateSitemap) {
      await this.generateSitemap();
    }
    
    // 生成RSS
    if (this.config.build.generateRss) {
      await this.generateRss();
    }
    
    // 生成robots.txt
    await this.generateRobots();
  }

  /**
   * 生成sitemap
   */
  async generateSitemap() {
    const posts = await this.getAllPosts();
    const pages = await this.getAllPages();
    
    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // 添加首页
    sitemap += `  <url>\n    <loc>${this.config.site.url}/</loc>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
    
    // 添加文章
    for (const post of posts) {
      sitemap += `  <url>\n    <loc>${this.config.site.url}${post.url}</loc>\n    <lastmod>${new Date(post.date).toISOString().split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
    }
    
    // 添加页面
    for (const page of pages) {
      sitemap += `  <url>\n    <loc>${this.config.site.url}${page.url}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>\n`;
    }
    
    sitemap += '</urlset>';
    
    await fs.writeFile(path.join(this.config.dirs.output, 'sitemap.xml'), sitemap);
  }

  /**
   * 生成RSS
   */
  async generateRss() {
    const posts = await this.getAllPosts();
    const recentPosts = posts.slice(0, 20);
    
    let rss = '<?xml version="1.0" encoding="UTF-8"?>\n';
    rss += '<rss version="2.0">\n<channel>\n';
    rss += `  <title>${this.config.site.title}</title>\n`;
    rss += `  <description>${this.config.site.description}</description>\n`;
    rss += `  <link>${this.config.site.url}</link>\n`;
    rss += `  <language>${this.config.site.language}</language>\n`;
    
    for (const post of recentPosts) {
      rss += '  <item>\n';
      rss += `    <title>${this.escapeXml(post.title)}</title>\n`;
      rss += `    <description>${this.escapeXml(post.excerpt || '')}</description>\n`;
      rss += `    <link>${this.config.site.url}${post.url}</link>\n`;
      rss += `    <pubDate>${new Date(post.date).toUTCString()}</pubDate>\n`;
      rss += '  </item>\n';
    }
    
    rss += '</channel>\n</rss>';
    
    await fs.writeFile(path.join(this.config.dirs.output, 'rss.xml'), rss);
  }

  /**
   * 生成robots.txt
   */
  async generateRobots() {
    const robots = `User-agent: *\nAllow: /\n\nSitemap: ${this.config.site.url}/sitemap.xml`;
    await fs.writeFile(path.join(this.config.dirs.output, 'robots.txt'), robots);
  }

  /**
   * 运行后处理插件
   */
  async runPostProcessPlugins() {
    for (const plugin of this.plugins) {
      try {
        await plugin(this);
      } catch (error) {
        console.warn(chalk.yellow(`⚠️  插件执行失败: ${error.message}`));
        this.stats.errors++;
      }
    }
  }

  /**
   * 生成构建报告
   */
  generateReport() {
    const buildTime = Date.now() - this.startTime;
    
    console.log('\n' + chalk.green('✅ 构建完成！'));
    console.log(chalk.blue('📊 构建统计:'));
    console.log(`   📝 文章: ${this.stats.posts}`);
    console.log(`   📄 页面: ${this.stats.pages}`);
    console.log(`   📦 资源: ${this.stats.assets}`);
    console.log(`   ⚠️  错误: ${this.stats.errors}`);
    console.log(`   ⏱️  用时: ${buildTime}ms`);
    console.log(`\n🎉 网站已生成到: ${chalk.cyan(this.config.dirs.output)}`);
  }

  // 工具方法
  
  async getFiles(dir, ext = '') {
    const files = [];
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        files.push(...await this.getFiles(fullPath, ext));
      } else if (!ext || item.name.endsWith(ext)) {
        files.push(fullPath);
      }
    }
    
    return files;
  }
  
  async getAllPosts() {
    const postsDir = path.join(this.config.dirs.content, 'posts');
    const posts = [];
    
    if (await fs.pathExists(postsDir)) {
      const files = await this.getFiles(postsDir, '.md');
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        const { data: frontMatter } = matter(content);
        
        posts.push({
          ...frontMatter,
          slug: frontMatter.slug || this.generateSlug(path.basename(file, '.md')),
          url: `/posts/${frontMatter.slug || this.generateSlug(path.basename(file, '.md'))}/`,
          date: frontMatter.date || new Date()
        });
      }
    }
    
    return posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
  
  async getAllPages() {
    const pagesDir = path.join(this.config.dirs.content, 'pages');
    const pages = [];
    
    if (await fs.pathExists(pagesDir)) {
      const files = await this.getFiles(pagesDir, '.md');
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf8');
        const { data: frontMatter } = matter(content);
        const slug = frontMatter.slug || this.generateSlug(path.basename(file, '.md'));
        
        pages.push({
          ...frontMatter,
          slug,
          url: `/${slug}/`
        });
      }
    }
    
    return pages;
  }
  
  generateSlug(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  
  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  

}

// 如果直接运行此文件，则执行构建
if (require.main === module) {
  const generator = new StaticSiteGenerator();
  generator.build();
}

module.exports = StaticSiteGenerator;