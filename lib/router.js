const path = require('path');
const Utils = require('./utils');

/**
 * 路由生成器
 * 负责根据文件路径和配置生成URL路由
 */
class Router {
  constructor(siteConfig) {
    this.siteConfig = siteConfig;
    this.utils = new Utils();
  }

  /**
   * 生成路由
   * @param {string} filePath - 文件路径
   * @param {object} routeConfig - 路由配置
   * @param {object} frontMatter - Front Matter数据
   * @returns {string} 生成的路由
   */
  generateRoute(filePath, routeConfig, frontMatter = {}) {
    // 如果Front Matter中指定了permalink，直接使用
    if (frontMatter.permalink) {
      return this.normalizeRoute(frontMatter.permalink);
    }

    // 获取相对于内容目录的路径
    const contentPath = path.resolve(process.cwd(), this.siteConfig.paths.content);
    const relativePath = path.relative(contentPath, filePath);
    
    // 移除目录前缀和文件扩展名
    const withoutDir = relativePath.replace(new RegExp(`^${routeConfig.directory}[\\/]?`), '');
    const withoutExt = withoutDir.replace(/\.[^.]+$/, '');
    
    // 生成slug
    const slug = this.generateSlug(withoutExt, frontMatter);
    
    // 根据路由模式生成最终路由
    return this.applyRoutePattern(routeConfig.pattern, slug, frontMatter);
  }

  /**
   * 生成slug
   * @param {string} pathSegment - 路径片段
   * @param {object} frontMatter - Front Matter数据
   * @returns {string} slug
   */
  generateSlug(pathSegment, frontMatter) {
    // 如果Front Matter中指定了slug，直接使用
    if (frontMatter.slug) {
      return frontMatter.slug;
    }

    // 处理嵌套目录
    const segments = pathSegment.split(path.sep);
    
    // 如果是index文件，使用父目录名
    if (segments[segments.length - 1] === 'index') {
      segments.pop();
    }
    
    // 生成最终slug
    return segments
      .map(segment => this.utils.slugify(segment))
      .join('/');
  }

  /**
   * 应用路由模式
   * @param {string} pattern - 路由模式
   * @param {string} slug - slug
   * @param {object} frontMatter - Front Matter数据
   * @returns {string} 最终路由
   */
  applyRoutePattern(pattern, slug, frontMatter) {
    let route = pattern;
    
    // 替换占位符
    const replacements = {
      ':slug': slug,
      ':year': this.getYear(frontMatter.date),
      ':month': this.getMonth(frontMatter.date),
      ':day': this.getDay(frontMatter.date),
      ':category': frontMatter.category || '',
      ':title': frontMatter.title ? this.utils.slugify(frontMatter.title) : slug
    };
    
    for (const [placeholder, value] of Object.entries(replacements)) {
      route = route.replace(placeholder, value);
    }
    
    return this.normalizeRoute(route);
  }

  /**
   * 标准化路由
   * @param {string} route - 原始路由
   * @returns {string} 标准化后的路由
   */
  normalizeRoute(route) {
    // 确保以/开头
    if (!route.startsWith('/')) {
      route = '/' + route;
    }
    
    // 移除重复的斜杠
    route = route.replace(/\/+/g, '/');
    
    // 移除末尾的斜杠（除了根路径）
    if (route.length > 1 && route.endsWith('/')) {
      route = route.slice(0, -1);
    }
    
    return route;
  }

  /**
   * 获取年份
   * @param {string|Date} date - 日期
   * @returns {string} 年份
   */
  getYear(date) {
    if (!date) return new Date().getFullYear().toString();
    return new Date(date).getFullYear().toString();
  }

  /**
   * 获取月份
   * @param {string|Date} date - 日期
   * @returns {string} 月份（补零）
   */
  getMonth(date) {
    if (!date) return (new Date().getMonth() + 1).toString().padStart(2, '0');
    return (new Date(date).getMonth() + 1).toString().padStart(2, '0');
  }

  /**
   * 获取日期
   * @param {string|Date} date - 日期
   * @returns {string} 日期（补零）
   */
  getDay(date) {
    if (!date) return new Date().getDate().toString().padStart(2, '0');
    return new Date(date).getDate().toString().padStart(2, '0');
  }

  /**
   * 生成分页路由
   * @param {string} baseRoute - 基础路由
   * @param {number} page - 页码
   * @returns {string} 分页路由
   */
  generatePaginationRoute(baseRoute, page) {
    if (page === 1) {
      return baseRoute;
    }
    
    return this.normalizeRoute(`${baseRoute}/page/${page}`);
  }

  /**
   * 生成分类路由
   * @param {string} category - 分类名
   * @returns {string} 分类路由
   */
  generateCategoryRoute(category) {
    const slug = this.utils.slugify(category);
    return this.normalizeRoute(`/category/${slug}`);
  }

  /**
   * 生成标签路由
   * @param {string} tag - 标签名
   * @returns {string} 标签路由
   */
  generateTagRoute(tag) {
    const slug = this.utils.slugify(tag);
    return this.normalizeRoute(`/tag/${slug}`);
  }

  /**
   * 生成归档路由
   * @param {number} year - 年份
   * @param {number} month - 月份（可选）
   * @returns {string} 归档路由
   */
  generateArchiveRoute(year, month) {
    if (month) {
      return this.normalizeRoute(`/archive/${year}/${month.toString().padStart(2, '0')}`);
    }
    return this.normalizeRoute(`/archive/${year}`);
  }

  /**
   * 解析路由参数
   * @param {string} pattern - 路由模式
   * @param {string} route - 实际路由
   * @returns {object} 解析出的参数
   */
  parseRouteParams(pattern, route) {
    const patternParts = pattern.split('/');
    const routeParts = route.split('/');
    const params = {};
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const routePart = routeParts[i];
      
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.slice(1);
        params[paramName] = routePart;
      }
    }
    
    return params;
  }

  /**
   * 检查路由是否匹配模式
   * @param {string} pattern - 路由模式
   * @param {string} route - 实际路由
   * @returns {boolean} 是否匹配
   */
  matchRoute(pattern, route) {
    const patternParts = pattern.split('/');
    const routeParts = route.split('/');
    
    if (patternParts.length !== routeParts.length) {
      return false;
    }
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const routePart = routeParts[i];
      
      if (!patternPart.startsWith(':') && patternPart !== routePart) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 获取所有路由
   * @param {Array} posts - 文章列表
   * @param {Array} pages - 页面列表
   * @returns {Array} 所有路由列表
   */
  getAllRoutes(posts = [], pages = []) {
    const routes = [];
    
    // 首页
    routes.push('/');
    
    // 文章路由
    posts.forEach(post => {
      routes.push(post.route);
    });
    
    // 页面路由
    pages.forEach(page => {
      routes.push(page.route);
    });
    
    return routes;
  }

  /**
   * 生成面包屑导航
   * @param {string} route - 当前路由
   * @returns {Array} 面包屑数组
   */
  generateBreadcrumb(route) {
    const parts = route.split('/').filter(part => part);
    const breadcrumb = [{ name: '首页', url: '/' }];
    
    let currentPath = '';
    parts.forEach(part => {
      currentPath += '/' + part;
      breadcrumb.push({
        name: this.utils.capitalize(part),
        url: currentPath
      });
    });
    
    return breadcrumb;
  }
}

module.exports = Router;