/**
 * 重新设计的构建配置文件 - 更清晰的目录结构
 * @type {import('./types').BuildConfig}
 */
module.exports = {
  // 构建模式
  mode: 'production', // 'development' | 'production'

  // 输出配置 - 重新设计的目录结构
  output: {
    path: './dist',
    clean: true,
    // 新的目录结构
    structure: {
      static: 'static',      // 静态资源目录 (CSS, JS, 图片等)
      views: 'views',        // 页面视图目录 (HTML页面)
      api: 'api',           // API接口目录
      config: 'config'      // 配置文件目录 (robots.txt, sitemap.xml等)
    }
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

  // 资源处理 - 重新映射到新的目录结构
  assets: {
    copy: [
      {
        from: 'public/css/**/*',
        to: './static/css/'
      },
      {
        from: 'public/js/**/*',
        to: './static/js/'
      },
      {
        from: 'public/images/**/*',
        to: './static/images/'
      },
      {
        from: 'public/fonts/**/*',
        to: './static/fonts/'
      },
      {
        from: 'public/favicon.ico',
        to: './static/'
      }
    ],
    ignore: [
      '**/.DS_Store',
      '**/Thumbs.db',
      '**/*.tmp'
    ]
  },

  // 页面生成配置
  pages: {
    // 首页和主要页面放在views根目录
    index: {
      output: './views/index.html'
    },
    about: {
      output: './views/about.html'
    },
    // 文章页面放在views/posts目录
    posts: {
      output: './views/posts/'
    },
    // 文档页面放在views/docs目录
    docs: {
      output: './views/docs/'
    },
    // 标签和分类页面
    tags: {
      output: './views/tags/'
    },
    categories: {
      output: './views/categories/'
    }
  },

  // 配置文件生成
  configFiles: {
    robots: {
      output: './config/robots.txt'
    },
    sitemap: {
      output: './config/sitemap.xml'
    },
    rss: {
      output: './config/rss.xml'
    },
    atom: {
      output: './config/atom.xml'
    },
    feed: {
      output: './config/feed.json'
    }
  },

  // Markdown 配置
  markdown: {
    options: {
      breaks: true,
      linkify: true,
      typographer: true
    },
    plugins: [],
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
    // 模板中的静态资源路径前缀
    staticPrefix: '/static/',
    globals: {
      // 全局模板变量
      staticPath: '/static/'
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
    // 开发服务器的静态资源路径映射
    staticRoutes: {
      '/static': './dist/static',
      '/views': './dist/views',
      '/api': './dist/api',
      '/config': './dist/config'
    },
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
        output: './api/search.json',
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
        output: './config/',
        maxItems: 20
      },
      sitemap: {
        enabled: true,
        filename: 'sitemap.xml',
        output: './config/',
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