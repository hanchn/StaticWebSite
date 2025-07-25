module.exports = {
  // 网站基本信息
  site: {
    title: '我的博客',
    description: '一个简洁的个人博客',
    author: '作者名称',
    url: 'https://example.com',
    language: 'zh-CN'
  },

  // 构建配置
  build: {
    // 输出目录
    outputDir: 'dist',
    // 静态资源目录
    assetsDir: 'assets',
    // 是否压缩HTML
    minifyHtml: true,
    // 是否生成sitemap
    generateSitemap: true,
    // 是否生成RSS
    generateRss: true
  },

  // 目录配置
  dirs: {
    content: 'content',      // 内容目录
    templates: 'templates',  // 模板目录
    static: 'static',       // 静态资源目录
    output: 'dist'          // 输出目录
  },

  // 页面配置
  pages: {
    // 每页文章数量
    postsPerPage: 10,
    // 文章排序方式 (date-desc, date-asc, title)
    sortBy: 'date-desc'
  },

  // 导航菜单
  nav: [
    { name: '首页', url: '/' },
    { name: '文章', url: '/posts/' },
    { name: '关于', url: '/about/' }
  ]
};