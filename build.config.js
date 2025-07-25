/**
 * 构建配置文件
 * @type {import('./types').BuildConfig}
 */
module.exports = {
  // 构建模式
  mode: 'production', // 'development' | 'production'

  // 输出配置
  output: {
    path: './dist',
    clean: true,
    assets: 'assets',
    api: 'api'
  },

  // 优化配置
  optimization: {
    minify: {
      html: true,
      css: true,
      js: true
    },
    compress: {
      gzip: false,
      brotli: false
    },
    cache: {
      enabled: true,
      directory: '.cache',
      strategy: 'content' // 'content' | 'timestamp'
    }
  },

  // 资源处理
  assets: {
    copy: [
      {
        from: 'public/**/*',
        to: './'
      }
    ],
    ignore: [
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/*.tmp'
    ]
  },

  // Markdown 配置
  markdown: {
    options: {
      breaks: true,
      linkify: true,
      typographer: true
    },
    plugins: [
      // 'markdown-it-anchor',
      // 'markdown-it-toc-done-right'
    ],
    highlight: {
      enabled: true,
      theme: 'github',
      languages: ['javascript', 'typescript', 'css', 'html', 'json', 'markdown']
    }
  },

  // 模板配置
  template: {
    engine: 'ejs',
    options: {
      cache: true,
      compileDebug: false
    },
    globals: {
      // 全局模板变量
    }
  },

  // 生成配置
  generate: {
    // 生成的文件类型
    files: {
      html: true,
      rss: true,
      sitemap: true,
      api: true,
      search: true
    },
    // 并发数
    concurrency: 10,
    // 增量构建
    incremental: true
  },

  // 开发配置
  dev: {
    port: 3000,
    host: 'localhost',
    open: true,
    liveReload: true,
    watch: {
      content: true,
      templates: true,
      config: true,
      public: true
    }
  },

  // 钩子配置
  hooks: {
    'before:build': [],
    'after:scan': [],
    'before:render': [],
    'after:render': [],
    'before:write': [],
    'after:build': [],
    'dev:reload': []
  },

  // 插件配置
  plugins: {
    // 插件加载顺序
    order: [
      'search',
      'seo',
      'rss',
      'sitemap'
    ],
    // 插件配置
    config: {
      search: {
        enabled: true,
        engine: 'lunr',
        fields: ['title', 'content', 'tags'],
        boost: {
          title: 10,
          tags: 5,
          content: 1
        }
      },
      seo: {
        enabled: true,
        generateMeta: true,
        generateJsonLd: true,
        generateOpenGraph: true
      },
      rss: {
        enabled: true,
        filename: 'rss.xml',
        maxItems: 20
      },
      sitemap: {
        enabled: true,
        filename: 'sitemap.xml',
        changefreq: 'weekly',
        priority: 0.8
      }
    }
  },

  // 错误处理
  errorHandling: {
    strict: false,
    logLevel: 'info', // 'error' | 'warn' | 'info' | 'debug'
    exitOnError: false
  }
};