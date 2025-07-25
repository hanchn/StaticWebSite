const fs = require('fs-extra');
const path = require('path');
const Utils = require('../lib/utils');

/**
 * RSS插件
 * 生成RSS和Atom订阅源
 */
class RSSPlugin {
  constructor(config = {}) {
    this.name = 'rss';
    this.version = '1.0.0';
    this.config = {
      enabled: true,
      rss: {
        enabled: true,
        path: 'rss.xml',
        limit: 20,
        includeContent: true
      },
      atom: {
        enabled: true,
        path: 'atom.xml',
        limit: 20,
        includeContent: true
      },
      json: {
        enabled: true,
        path: 'feed.json',
        limit: 20,
        includeContent: true
      },
      categories: {
        enabled: false,
        path: 'categories/{category}/rss.xml'
      },
      tags: {
        enabled: false,
        path: 'tags/{tag}/rss.xml'
      },
      ...config
    };
    
    this.utils = new Utils();
  }

  /**
   * 插件钩子
   */
  get hooks() {
    return {
      'after:build': [this.generateFeeds.bind(this)]
    };
  }

  /**
   * 初始化插件
   */
  async init(config) {
    this.config = this.utils.deepMerge(this.config, config);
    this.utils.log('RSS插件已初始化', 'info');
  }

  /**
   * 生成订阅源
   * @param {object} buildData - 构建数据
   */
  async generateFeeds(buildData) {
    if (!this.config.enabled) {
      return buildData;
    }

    const outputDir = buildData.config.build.output;
    const site = buildData.config.site || {};
    const posts = this.getValidPosts(buildData.posts || []);
    
    // 生成主要订阅源
    if (this.config.rss.enabled) {
      await this.generateRSSFeed(outputDir, site, posts, this.config.rss);
    }
    
    if (this.config.atom.enabled) {
      await this.generateAtomFeed(outputDir, site, posts, this.config.atom);
    }
    
    if (this.config.json.enabled) {
      await this.generateJSONFeed(outputDir, site, posts, this.config.json);
    }
    
    // 生成分类订阅源
    if (this.config.categories.enabled && buildData.categories) {
      await this.generateCategoryFeeds(outputDir, site, buildData.categories, buildData.posts);
    }
    
    // 生成标签订阅源
    if (this.config.tags.enabled && buildData.tags) {
      await this.generateTagFeeds(outputDir, site, buildData.tags, buildData.posts);
    }
    
    return buildData;
  }

  /**
   * 获取有效的文章列表
   * @param {Array} posts - 文章列表
   * @returns {Array} 有效文章列表
   */
  getValidPosts(posts) {
    return posts
      .filter(post => !post.draft && post.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  /**
   * 生成RSS 2.0订阅源
   * @param {string} outputDir - 输出目录
   * @param {object} site - 站点配置
   * @param {Array} posts - 文章列表
   * @param {object} config - RSS配置
   */
  async generateRSSFeed(outputDir, site, posts, config) {
    const feedPath = path.join(outputDir, config.path);
    const limitedPosts = posts.slice(0, config.limit);
    
    let rssContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    rssContent += '<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">\n';
    rssContent += '  <channel>\n';
    
    // 频道信息
    rssContent += `    <title>${this.escapeXml(site.title || '')}</title>\n`;
    rssContent += `    <link>${site.url || ''}</link>\n`;
    rssContent += `    <description>${this.escapeXml(site.description || '')}</description>\n`;
    rssContent += `    <language>${site.language || 'zh-CN'}</language>\n`;
    rssContent += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
    rssContent += `    <generator>Static Site Generator</generator>\n`;
    
    if (site.url) {
      rssContent += `    <atom:link href="${site.url}/${config.path}" rel="self" type="application/rss+xml" />\n`;
    }
    
    // 文章项目
    limitedPosts.forEach(post => {
      rssContent += '    <item>\n';
      rssContent += `      <title>${this.escapeXml(post.title || '')}</title>\n`;
      rssContent += `      <link>${this.getPostUrl(site, post)}</link>\n`;
      rssContent += `      <guid isPermaLink="true">${this.getPostUrl(site, post)}</guid>\n`;
      rssContent += `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>\n`;
      
      if (post.author) {
        rssContent += `      <author>${this.escapeXml(post.author)}</author>\n`;
      }
      
      if (post.description || post.excerpt) {
        rssContent += `      <description>${this.escapeXml(post.description || post.excerpt || '')}</description>\n`;
      }
      
      // 分类
      if (post.categories && post.categories.length) {
        post.categories.forEach(category => {
          rssContent += `      <category>${this.escapeXml(category)}</category>\n`;
        });
      }
      
      // 完整内容
      if (config.includeContent && post.content) {
        rssContent += `      <content:encoded><![CDATA[${post.content}]]></content:encoded>\n`;
      }
      
      rssContent += '    </item>\n';
    });
    
    rssContent += '  </channel>\n';
    rssContent += '</rss>';
    
    await this.utils.writeFile(feedPath, rssContent);
    this.utils.log(`RSS订阅源已生成: ${feedPath}`, 'info');
  }

  /**
   * 生成Atom订阅源
   * @param {string} outputDir - 输出目录
   * @param {object} site - 站点配置
   * @param {Array} posts - 文章列表
   * @param {object} config - Atom配置
   */
  async generateAtomFeed(outputDir, site, posts, config) {
    const feedPath = path.join(outputDir, config.path);
    const limitedPosts = posts.slice(0, config.limit);
    
    let atomContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    atomContent += '<feed xmlns="http://www.w3.org/2005/Atom">\n';
    
    // Feed信息
    atomContent += `  <title>${this.escapeXml(site.title || '')}</title>\n`;
    atomContent += `  <subtitle>${this.escapeXml(site.description || '')}</subtitle>\n`;
    atomContent += `  <link href="${site.url || ''}" />\n`;
    
    if (site.url) {
      atomContent += `  <link href="${site.url}/${config.path}" rel="self" />\n`;
    }
    
    atomContent += `  <id>${site.url || ''}</id>\n`;
    atomContent += `  <updated>${new Date().toISOString()}</updated>\n`;
    atomContent += `  <generator>Static Site Generator</generator>\n`;
    
    if (site.author) {
      atomContent += '  <author>\n';
      atomContent += `    <name>${this.escapeXml(site.author)}</name>\n`;
      if (site.email) {
        atomContent += `    <email>${this.escapeXml(site.email)}</email>\n`;
      }
      atomContent += '  </author>\n';
    }
    
    // 文章条目
    limitedPosts.forEach(post => {
      atomContent += '  <entry>\n';
      atomContent += `    <title>${this.escapeXml(post.title || '')}</title>\n`;
      atomContent += `    <link href="${this.getPostUrl(site, post)}" />\n`;
      atomContent += `    <id>${this.getPostUrl(site, post)}</id>\n`;
      atomContent += `    <published>${new Date(post.date).toISOString()}</published>\n`;
      atomContent += `    <updated>${new Date(post.updated || post.date).toISOString()}</updated>\n`;
      
      if (post.author) {
        atomContent += '    <author>\n';
        atomContent += `      <name>${this.escapeXml(post.author)}</name>\n`;
        atomContent += '    </author>\n';
      }
      
      if (post.description || post.excerpt) {
        atomContent += `    <summary>${this.escapeXml(post.description || post.excerpt || '')}</summary>\n`;
      }
      
      // 分类
      if (post.categories && post.categories.length) {
        post.categories.forEach(category => {
          atomContent += `    <category term="${this.escapeXml(category)}" />\n`;
        });
      }
      
      // 完整内容
      if (config.includeContent && post.content) {
        atomContent += `    <content type="html"><![CDATA[${post.content}]]></content>\n`;
      }
      
      atomContent += '  </entry>\n';
    });
    
    atomContent += '</feed>';
    
    await this.utils.writeFile(feedPath, atomContent);
    this.utils.log(`Atom订阅源已生成: ${feedPath}`, 'info');
  }

  /**
   * 生成JSON Feed
   * @param {string} outputDir - 输出目录
   * @param {object} site - 站点配置
   * @param {Array} posts - 文章列表
   * @param {object} config - JSON配置
   */
  async generateJSONFeed(outputDir, site, posts, config) {
    const feedPath = path.join(outputDir, config.path);
    const limitedPosts = posts.slice(0, config.limit);
    
    const jsonFeed = {
      version: 'https://jsonfeed.org/version/1.1',
      title: site.title || '',
      description: site.description || '',
      home_page_url: site.url || '',
      feed_url: site.url ? `${site.url}/${config.path}` : '',
      language: site.language || 'zh-CN',
      items: []
    };
    
    if (site.author) {
      jsonFeed.authors = [{
        name: site.author,
        email: site.email || undefined
      }];
    }
    
    // 文章项目
    limitedPosts.forEach(post => {
      const item = {
        id: this.getPostUrl(site, post),
        url: this.getPostUrl(site, post),
        title: post.title || '',
        summary: post.description || post.excerpt || '',
        date_published: new Date(post.date).toISOString(),
        date_modified: new Date(post.updated || post.date).toISOString()
      };
      
      if (post.author) {
        item.authors = [{ name: post.author }];
      }
      
      if (post.tags && post.tags.length) {
        item.tags = post.tags;
      }
      
      if (config.includeContent && post.content) {
        item.content_html = post.content;
      }
      
      if (post.image || post.cover) {
        item.image = this.resolveImageUrl(post.image || post.cover, site);
      }
      
      jsonFeed.items.push(item);
    });
    
    await this.utils.writeFile(feedPath, JSON.stringify(jsonFeed, null, 2));
    this.utils.log(`JSON Feed已生成: ${feedPath}`, 'info');
  }

  /**
   * 生成分类订阅源
   * @param {string} outputDir - 输出目录
   * @param {object} site - 站点配置
   * @param {object} categories - 分类数据
   * @param {Array} allPosts - 所有文章
   */
  async generateCategoryFeeds(outputDir, site, categories, allPosts) {
    for (const [categoryName, categoryPosts] of Object.entries(categories)) {
      const validPosts = this.getValidPosts(categoryPosts);
      const feedPath = this.config.categories.path.replace('{category}', this.utils.slugify(categoryName));
      const fullPath = path.join(outputDir, feedPath);
      
      // 确保目录存在
      await fs.ensureDir(path.dirname(fullPath));
      
      // 生成RSS
      await this.generateCategoryRSS(fullPath, site, categoryName, validPosts);
      
      this.utils.log(`分类"${categoryName}"的RSS已生成: ${fullPath}`, 'info');
    }
  }

  /**
   * 生成分类RSS
   * @param {string} feedPath - 订阅源路径
   * @param {object} site - 站点配置
   * @param {string} categoryName - 分类名称
   * @param {Array} posts - 文章列表
   */
  async generateCategoryRSS(feedPath, site, categoryName, posts) {
    const limitedPosts = posts.slice(0, 10);
    
    let rssContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    rssContent += '<rss version="2.0">\n';
    rssContent += '  <channel>\n';
    
    rssContent += `    <title>${this.escapeXml(site.title || '')} - ${this.escapeXml(categoryName)}</title>\n`;
    rssContent += `    <link>${site.url || ''}</link>\n`;
    rssContent += `    <description>${this.escapeXml(categoryName)}分类的文章</description>\n`;
    rssContent += `    <language>${site.language || 'zh-CN'}</language>\n`;
    rssContent += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
    
    limitedPosts.forEach(post => {
      rssContent += '    <item>\n';
      rssContent += `      <title>${this.escapeXml(post.title || '')}</title>\n`;
      rssContent += `      <link>${this.getPostUrl(site, post)}</link>\n`;
      rssContent += `      <guid>${this.getPostUrl(site, post)}</guid>\n`;
      rssContent += `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>\n`;
      
      if (post.description || post.excerpt) {
        rssContent += `      <description>${this.escapeXml(post.description || post.excerpt || '')}</description>\n`;
      }
      
      rssContent += '    </item>\n';
    });
    
    rssContent += '  </channel>\n';
    rssContent += '</rss>';
    
    await this.utils.writeFile(feedPath, rssContent);
  }

  /**
   * 生成标签订阅源
   * @param {string} outputDir - 输出目录
   * @param {object} site - 站点配置
   * @param {object} tags - 标签数据
   * @param {Array} allPosts - 所有文章
   */
  async generateTagFeeds(outputDir, site, tags, allPosts) {
    for (const [tagName, tagPosts] of Object.entries(tags)) {
      const validPosts = this.getValidPosts(tagPosts);
      const feedPath = this.config.tags.path.replace('{tag}', this.utils.slugify(tagName));
      const fullPath = path.join(outputDir, feedPath);
      
      // 确保目录存在
      await fs.ensureDir(path.dirname(fullPath));
      
      // 生成RSS
      await this.generateTagRSS(fullPath, site, tagName, validPosts);
      
      this.utils.log(`标签"${tagName}"的RSS已生成: ${fullPath}`, 'info');
    }
  }

  /**
   * 生成标签RSS
   * @param {string} feedPath - 订阅源路径
   * @param {object} site - 站点配置
   * @param {string} tagName - 标签名称
   * @param {Array} posts - 文章列表
   */
  async generateTagRSS(feedPath, site, tagName, posts) {
    const limitedPosts = posts.slice(0, 10);
    
    let rssContent = '<?xml version="1.0" encoding="UTF-8"?>\n';
    rssContent += '<rss version="2.0">\n';
    rssContent += '  <channel>\n';
    
    rssContent += `    <title>${this.escapeXml(site.title || '')} - ${this.escapeXml(tagName)}</title>\n`;
    rssContent += `    <link>${site.url || ''}</link>\n`;
    rssContent += `    <description>${this.escapeXml(tagName)}标签的文章</description>\n`;
    rssContent += `    <language>${site.language || 'zh-CN'}</language>\n`;
    rssContent += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
    
    limitedPosts.forEach(post => {
      rssContent += '    <item>\n';
      rssContent += `      <title>${this.escapeXml(post.title || '')}</title>\n`;
      rssContent += `      <link>${this.getPostUrl(site, post)}</link>\n`;
      rssContent += `      <guid>${this.getPostUrl(site, post)}</guid>\n`;
      rssContent += `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>\n`;
      
      if (post.description || post.excerpt) {
        rssContent += `      <description>${this.escapeXml(post.description || post.excerpt || '')}</description>\n`;
      }
      
      rssContent += '    </item>\n';
    });
    
    rssContent += '  </channel>\n';
    rssContent += '</rss>';
    
    await this.utils.writeFile(feedPath, rssContent);
  }

  /**
   * 获取文章完整URL
   * @param {object} site - 站点配置
   * @param {object} post - 文章数据
   * @returns {string} 完整URL
   */
  getPostUrl(site, post) {
    const baseUrl = site.url || '';
    return baseUrl.replace(/\/$/, '') + post.url;
  }

  /**
   * 解析图片URL
   * @param {string} imageUrl - 图片URL
   * @param {object} site - 站点数据
   * @returns {string} 完整的图片URL
   */
  resolveImageUrl(imageUrl, site) {
    if (!imageUrl) {
      return '';
    }
    
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    const baseUrl = site.url || '';
    if (baseUrl) {
      return baseUrl.replace(/\/$/, '') + (imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl);
    }
    
    return imageUrl;
  }

  /**
   * 转义XML字符
   * @param {string} text - 文本
   * @returns {string} 转义后的文本
   */
  escapeXml(text) {
    if (!text) return '';
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * 销毁插件
   */
  async destroy() {
    this.utils.log('RSS插件已销毁', 'info');
  }
}

module.exports = RSSPlugin;