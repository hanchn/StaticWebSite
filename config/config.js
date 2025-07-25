// 站点配置文件
export default {
  // 站点基本信息
  site: {
    title: "我的静态博客",
    description: "基于 Node.js + Express + EJS 的静态博客系统",
    author: "博客作者",
    url: "http://localhost:3000",
    language: "zh-CN",
    timezone: "Asia/Shanghai"
  },

  // 服务器配置
  server: {
    port: 3000,
    host: "localhost"
  },

  // 构建配置
  build: {
    outputDir: "dist",
    publicPath: "/",
    cleanBeforeBuild: true
  },

  // 内容配置
  content: {
    postsDir: "content/posts",
    pagesDir: "content/pages",
    uploadsDir: "content/uploads",
    postsPerPage: 10
  },

  // 主题配置
  theme: {
    name: "default",
    layout: "layouts/main",
    dateFormat: "YYYY-MM-DD",
    excerpt: {
      length: 200,
      separator: "<!-- more -->"
    }
  },

  // 导航菜单
  navigation: [
    { name: "首页", url: "/" },
    { name: "文章", url: "/posts" },
    { name: "关于", url: "/about" }
  ],

  // 社交链接
  social: {
    github: "",
    twitter: "",
    email: ""
  },

  // SEO 配置
  seo: {
    keywords: ["博客", "技术", "分享"],
    googleAnalytics: "",
    baiduAnalytics: ""
  }
};