/**
 * 站点配置文件
 * @type {import('./types').SiteConfig}
 */
module.exports = {
  // 基本站点信息
  title: 'My Static Blog',
  description: '一个基于静态生成器的个人博客',
  author: 'Blog Author',
  url: 'https://example.com',
  language: 'zh-CN',
  timezone: 'Asia/Shanghai',

  // 构建路径配置
  paths: {
    content: './content',
    output: './dist',
    templates: './templates',
    public: './public',
    plugins: './plugins'
  },

  // 路由规则
  routes: {
    posts: {
      pattern: '/post/:slug',
      directory: 'posts',
      template: 'post'
    },
    pages: {
      pattern: '/:slug',
      directory: 'pages',
      template: 'page'
    },
    docs: {
      pattern: '/docs/:slug',
      directory: 'docs',
      template: 'doc'
    }
  },

  // 默认模板映射
  templates: {
    default: 'default',
    post: 'post',
    page: 'page',
    index: 'index',
    archive: 'archive',
    category: 'category',
    tag: 'tag',
    search: 'search'
  },

  // 分页配置
  pagination: {
    perPage: 10,
    maxPages: 10
  },

  // 日期格式
  dateFormat: 'YYYY-MM-DD',
  timeFormat: 'HH:mm:ss',

  // SEO 配置
  seo: {
    title: 'My Static Blog',
    description: '一个基于静态生成器的个人博客',
    keywords: ['blog', 'static', 'generator'],
    author: 'Blog Author',
    ogImage: '/images/og-default.jpg',
    twitterCard: 'summary_large_image'
  },

  // RSS 配置
  rss: {
    title: 'My Static Blog',
    description: '一个基于静态生成器的个人博客',
    language: 'zh-CN',
    ttl: 60,
    maxItems: 20,
    categories: [], // 生成分类RSS
    customFeeds: {
      // 'featured': { filter: post => post.featured },
      // 'recent': { limit: 10 }
    }
  },

  // 搜索配置
  search: {
    enabled: true,
    fields: ['title', 'content', 'tags', 'category'],
    limit: 50
  },

  // 主题配置
  theme: {
    name: 'default',
    config: {
      colors: {
        primary: '#007acc',
        secondary: '#f0f0f0'
      },
      layout: {
        sidebar: true,
        toc: true
      }
    }
  },

  // 插件配置
  plugins: [
    // 'search',
    // 'seo',
    // 'rss',
    // 'sitemap'
  ],

  // 开发服务器配置
  server: {
    port: 3000,
    host: 'localhost',
    liveReload: true
  },

  // 构建配置
  build: {
    clean: true,
    minify: false,
    sourcemap: false,
    cache: true
  }
};