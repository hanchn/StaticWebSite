const fs = require('fs-extra');
const path = require('path');
const Utils = require('../lib/utils');

/**
 * SEO插件
 * 生成SEO优化的meta标签和结构化数据
 */
class SEOPlugin {
  constructor(config = {}) {
    this.name = 'seo';
    this.version = '1.0.0';
    this.config = {
      enabled: true,
      defaultMeta: {
        description: '',
        keywords: '',
        author: '',
        robots: 'index,follow',
        viewport: 'width=device-width, initial-scale=1.0'
      },
      openGraph: {
        enabled: true,
        type: 'website',
        locale: 'zh_CN',
        siteName: ''
      },
      twitter: {
        enabled: true,
        card: 'summary_large_image',
        site: '',
        creator: ''
      },
      jsonLd: {
        enabled: true,
        organization: {
          name: '',
          url: '',
          logo: ''
        }
      },
      canonical: {
        enabled: true,
        baseUrl: ''
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
      'before:render': [this.injectSEOData.bind(this)],
      'after:build': [this.generateSEOFiles.bind(this)]
    };
  }

  /**
   * 初始化插件
   */
  async init(config) {
    this.config = this.utils.deepMerge(this.config, config);
    this.utils.log('SEO插件已初始化', 'info');
  }

  /**
   * 注入SEO数据到模板数据中
   * @param {object} data - 模板数据
   */
  async injectSEOData(data) {
    if (!this.config.enabled) {
      return data;
    }

    // 为每个页面生成SEO数据
    if (data.page) {
      data.seo = this.generateSEOData(data.page, data.site);
    }
    
    return data;
  }

  /**
   * 生成SEO数据
   * @param {object} page - 页面数据
   * @param {object} site - 站点数据
   * @returns {object} SEO数据
   */
  generateSEOData(page, site = {}) {
    const seoData = {
      title: this.generateTitle(page, site),
      description: this.generateDescription(page, site),
      keywords: this.generateKeywords(page, site),
      canonical: this.generateCanonical(page, site),
      robots: page.robots || this.config.defaultMeta.robots,
      author: page.author || site.author || this.config.defaultMeta.author,
      viewport: this.config.defaultMeta.viewport
    };
    
    // Open Graph数据
    if (this.config.openGraph.enabled) {
      seoData.openGraph = this.generateOpenGraphData(page, site, seoData);
    }
    
    // Twitter Card数据
    if (this.config.twitter.enabled) {
      seoData.twitter = this.generateTwitterData(page, site, seoData);
    }
    
    // JSON-LD结构化数据
    if (this.config.jsonLd.enabled) {
      seoData.jsonLd = this.generateJsonLdData(page, site, seoData);
    }
    
    return seoData;
  }

  /**
   * 生成页面标题
   * @param {object} page - 页面数据
   * @param {object} site - 站点数据
   * @returns {string} 标题
   */
  generateTitle(page, site) {
    if (page.seoTitle) {
      return page.seoTitle;
    }
    
    if (page.title) {
      return page.url === '/' ? 
        `${page.title} - ${site.title}` : 
        `${page.title} | ${site.title}`;
    }
    
    return site.title || '';
  }

  /**
   * 生成页面描述
   * @param {object} page - 页面数据
   * @param {object} site - 站点数据
   * @returns {string} 描述
   */
  generateDescription(page, site) {
    if (page.seoDescription) {
      return page.seoDescription;
    }
    
    if (page.description) {
      return page.description;
    }
    
    if (page.excerpt) {
      return page.excerpt.length > 160 ? 
        page.excerpt.substring(0, 157) + '...' : 
        page.excerpt;
    }
    
    return site.description || this.config.defaultMeta.description;
  }

  /**
   * 生成关键词
   * @param {object} page - 页面数据
   * @param {object} site - 站点数据
   * @returns {string} 关键词
   */
  generateKeywords(page, site) {
    const keywords = [];
    
    // 页面关键词
    if (page.keywords) {
      if (Array.isArray(page.keywords)) {
        keywords.push(...page.keywords);
      } else {
        keywords.push(page.keywords);
      }
    }
    
    // 标签作为关键词
    if (page.tags && Array.isArray(page.tags)) {
      keywords.push(...page.tags);
    }
    
    // 分类作为关键词
    if (page.categories && Array.isArray(page.categories)) {
      keywords.push(...page.categories);
    }
    
    // 站点默认关键词
    if (keywords.length === 0 && this.config.defaultMeta.keywords) {
      keywords.push(this.config.defaultMeta.keywords);
    }
    
    return [...new Set(keywords)].join(', ');
  }

  /**
   * 生成规范链接
   * @param {object} page - 页面数据
   * @param {object} site - 站点数据
   * @returns {string} 规范链接
   */
  generateCanonical(page, site) {
    if (!this.config.canonical.enabled) {
      return '';
    }
    
    const baseUrl = this.config.canonical.baseUrl || site.url || '';
    
    if (!baseUrl) {
      return '';
    }
    
    return baseUrl.replace(/\/$/, '') + page.url;
  }

  /**
   * 生成Open Graph数据
   * @param {object} page - 页面数据
   * @param {object} site - 站点数据
   * @param {object} seoData - SEO数据
   * @returns {object} Open Graph数据
   */
  generateOpenGraphData(page, site, seoData) {
    const ogData = {
      type: page.ogType || this.getPageType(page),
      title: page.ogTitle || seoData.title,
      description: page.ogDescription || seoData.description,
      url: seoData.canonical,
      siteName: this.config.openGraph.siteName || site.title,
      locale: page.ogLocale || this.config.openGraph.locale
    };
    
    // 图片
    if (page.ogImage || page.image || page.cover) {
      ogData.image = this.resolveImageUrl(page.ogImage || page.image || page.cover, site);
    }
    
    // 文章特定数据
    if (page.type === 'post' || ogData.type === 'article') {
      ogData.article = {
        publishedTime: page.date,
        modifiedTime: page.updated || page.date,
        author: page.author || site.author,
        section: page.categories && page.categories[0],
        tags: page.tags
      };
    }
    
    return ogData;
  }

  /**
   * 生成Twitter Card数据
   * @param {object} page - 页面数据
   * @param {object} site - 站点数据
   * @param {object} seoData - SEO数据
   * @returns {object} Twitter Card数据
   */
  generateTwitterData(page, site, seoData) {
    const twitterData = {
      card: page.twitterCard || this.config.twitter.card,
      site: this.config.twitter.site,
      creator: page.twitterCreator || this.config.twitter.creator,
      title: page.twitterTitle || seoData.title,
      description: page.twitterDescription || seoData.description
    };
    
    // 图片
    if (page.twitterImage || page.image || page.cover) {
      twitterData.image = this.resolveImageUrl(page.twitterImage || page.image || page.cover, site);
    }
    
    return twitterData;
  }

  /**
   * 生成JSON-LD结构化数据
   * @param {object} page - 页面数据
   * @param {object} site - 站点数据
   * @param {object} seoData - SEO数据
   * @returns {object} JSON-LD数据
   */
  generateJsonLdData(page, site, seoData) {
    const jsonLdData = [];
    
    // 网站信息
    if (page.url === '/') {
      jsonLdData.push(this.generateWebsiteJsonLd(site, seoData));
      
      // 组织信息
      if (this.config.jsonLd.organization.name) {
        jsonLdData.push(this.generateOrganizationJsonLd(site));
      }
    }
    
    // 文章信息
    if (page.type === 'post') {
      jsonLdData.push(this.generateArticleJsonLd(page, site, seoData));
    }
    
    // 面包屑导航
    if (page.breadcrumbs && page.breadcrumbs.length > 1) {
      jsonLdData.push(this.generateBreadcrumbJsonLd(page.breadcrumbs, site));
    }
    
    return jsonLdData;
  }

  /**
   * 生成网站JSON-LD
   * @param {object} site - 站点数据
   * @param {object} seoData - SEO数据
   * @returns {object} 网站JSON-LD
   */
  generateWebsiteJsonLd(site, seoData) {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: site.title,
      description: site.description,
      url: site.url,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${site.url}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };
  }

  /**
   * 生成组织JSON-LD
   * @param {object} site - 站点数据
   * @returns {object} 组织JSON-LD
   */
  generateOrganizationJsonLd(site) {
    const org = this.config.jsonLd.organization;
    
    return {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: org.name || site.title,
      url: org.url || site.url,
      logo: org.logo ? this.resolveImageUrl(org.logo, site) : undefined
    };
  }

  /**
   * 生成文章JSON-LD
   * @param {object} page - 页面数据
   * @param {object} site - 站点数据
   * @param {object} seoData - SEO数据
   * @returns {object} 文章JSON-LD
   */
  generateArticleJsonLd(page, site, seoData) {
    const article = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: page.title,
      description: seoData.description,
      url: seoData.canonical,
      datePublished: page.date,
      dateModified: page.updated || page.date,
      author: {
        '@type': 'Person',
        name: page.author || site.author
      },
      publisher: {
        '@type': 'Organization',
        name: site.title,
        url: site.url
      }
    };
    
    // 图片
    if (page.image || page.cover) {
      article.image = this.resolveImageUrl(page.image || page.cover, site);
    }
    
    // 关键词
    if (page.tags && page.tags.length) {
      article.keywords = page.tags.join(', ');
    }
    
    // 分类
    if (page.categories && page.categories.length) {
      article.articleSection = page.categories[0];
    }
    
    // 字数和阅读时间
    if (page.wordCount) {
      article.wordCount = page.wordCount;
    }
    
    if (page.readingTime) {
      article.timeRequired = `PT${page.readingTime}M`;
    }
    
    return article;
  }

  /**
   * 生成面包屑JSON-LD
   * @param {Array} breadcrumbs - 面包屑数据
   * @param {object} site - 站点数据
   * @returns {object} 面包屑JSON-LD
   */
  generateBreadcrumbJsonLd(breadcrumbs, site) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.title,
        item: crumb.url.startsWith('http') ? crumb.url : `${site.url}${crumb.url}`
      }))
    };
  }

  /**
   * 获取页面类型
   * @param {object} page - 页面数据
   * @returns {string} 页面类型
   */
  getPageType(page) {
    if (page.type === 'post') {
      return 'article';
    }
    
    if (page.url === '/') {
      return 'website';
    }
    
    return 'webpage';
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
    
    // 已经是完整URL
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    
    // 相对URL
    const baseUrl = site.url || '';
    if (baseUrl) {
      return baseUrl.replace(/\/$/, '') + (imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl);
    }
    
    return imageUrl;
  }

  /**
   * 生成SEO文件
   * @param {object} buildData - 构建数据
   */
  async generateSEOFiles(buildData) {
    if (!this.config.enabled) {
      return buildData;
    }

    const outputDir = buildData.config.build.output;
    
    // 生成robots.txt
    await this.generateRobotsTxt(outputDir, buildData);
    
    // 生成sitemap.xml
    await this.generateSitemap(outputDir, buildData);
    
    return buildData;
  }

  /**
   * 生成robots.txt
   * @param {string} outputDir - 输出目录
   * @param {object} buildData - 构建数据
   */
  async generateRobotsTxt(outputDir, buildData) {
    const site = buildData.config.site || {};
    const robotsPath = path.join(outputDir, 'robots.txt');
    
    let robotsContent = 'User-agent: *\n';
    
    // 允许所有
    robotsContent += 'Allow: /\n\n';
    
    // 禁止访问的路径
    const disallowPaths = [
      '/api/',
      '/admin/',
      '/*.json$',
      '/*.xml$'
    ];
    
    disallowPaths.forEach(path => {
      robotsContent += `Disallow: ${path}\n`;
    });
    
    // Sitemap位置
    if (site.url) {
      robotsContent += `\nSitemap: ${site.url.replace(/\/$/, '')}/sitemap.xml\n`;
    }
    
    await this.utils.writeFile(robotsPath, robotsContent);
    this.utils.log(`robots.txt已生成: ${robotsPath}`, 'info');
  }

  /**
   * 生成sitemap.xml
   * @param {string} outputDir - 输出目录
   * @param {object} buildData - 构建数据
   */
  async generateSitemap(outputDir, buildData) {
    const site = buildData.config.site || {};
    const sitemapPath = path.join(outputDir, 'sitemap.xml');
    
    if (!site.url) {
      this.utils.log('未配置站点URL，跳过sitemap生成', 'warn');
      return;
    }
    
    const baseUrl = site.url.replace(/\/$/, '');
    const urls = [];
    
    // 首页
    urls.push({
      loc: baseUrl + '/',
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
      priority: '1.0'
    });
    
    // 文章页面
    if (buildData.posts) {
      buildData.posts.forEach(post => {
        if (!post.draft) {
          urls.push({
            loc: baseUrl + post.url,
            lastmod: new Date(post.updated || post.date).toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: '0.8'
          });
        }
      });
    }
    
    // 页面
    if (buildData.pages) {
      buildData.pages.forEach(page => {
        urls.push({
          loc: baseUrl + page.url,
          lastmod: new Date(page.updated || page.date).toISOString().split('T')[0],
          changefreq: 'monthly',
          priority: '0.6'
        });
      });
    }
    
    // 分类页面
    if (buildData.categories) {
      Object.keys(buildData.categories).forEach(category => {
        urls.push({
          loc: baseUrl + `/categories/${this.utils.slugify(category)}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.5'
        });
      });
    }
    
    // 标签页面
    if (buildData.tags) {
      Object.keys(buildData.tags).forEach(tag => {
        urls.push({
          loc: baseUrl + `/tags/${this.utils.slugify(tag)}`,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'weekly',
          priority: '0.4'
        });
      });
    }
    
    // 生成XML
    const sitemapXml = this.generateSitemapXml(urls);
    
    await this.utils.writeFile(sitemapPath, sitemapXml);
    this.utils.log(`sitemap.xml已生成: ${sitemapPath}`, 'info');
  }

  /**
   * 生成sitemap XML内容
   * @param {Array} urls - URL列表
   * @returns {string} XML内容
   */
  generateSitemapXml(urls) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    urls.forEach(url => {
      xml += '  <url>\n';
      xml += `    <loc>${this.escapeXml(url.loc)}</loc>\n`;
      xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
      xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
      xml += `    <priority>${url.priority}</priority>\n`;
      xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    
    return xml;
  }

  /**
   * 转义XML字符
   * @param {string} text - 文本
   * @returns {string} 转义后的文本
   */
  escapeXml(text) {
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
    this.utils.log('SEO插件已销毁', 'info');
  }
}

module.exports = SEOPlugin;