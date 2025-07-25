const fs = require('fs-extra');
const path = require('path');
const ejs = require('ejs');
const Utils = require('./utils');

/**
 * 模板引擎
 * 负责EJS模板的加载、渲染和管理
 */
class Template {
  constructor(siteConfig, buildConfig) {
    this.siteConfig = siteConfig;
    this.buildConfig = buildConfig;
    this.utils = new Utils();
    
    // 模板缓存
    this.templateCache = new Map();
    this.layoutCache = new Map();
    this.partialCache = new Map();
    
    // 模板路径
    this.templatePath = path.resolve(process.cwd(), siteConfig.paths.templates);
    this.layoutPath = path.join(this.templatePath, 'layouts');
    this.partialPath = path.join(this.templatePath, 'partials');
    
    // 配置EJS
    this.configureEJS();
  }

  /**
   * 配置EJS引擎
   */
  configureEJS() {
    const options = this.buildConfig.template?.options || {};
    
    // 设置EJS选项，但不直接修改ejs.cache
    this.ejsOptions = {
      cache: options.cache !== false,
      delimiter: options.delimiter || '%',
      openDelimiter: options.openDelimiter || '<',
      closeDelimiter: options.closeDelimiter || '>'
    };
  }

  /**
   * 渲染模板
   * @param {string} templateName - 模板名称
   * @param {object} data - 模板数据
   * @returns {Promise<string>} 渲染后的HTML
   */
  async render(templateName, data = {}) {
    try {
      // 获取模板内容
      const templateContent = await this.getTemplate(templateName);
      
      // 准备模板数据
      const templateData = await this.prepareTemplateData(data);
      
      // 渲染模板
      let html = await ejs.render(templateContent, templateData, {
        filename: this.getTemplatePath(templateName),
        cache: this.ejsOptions.cache,
        compileDebug: this.buildConfig.template?.options?.compileDebug !== false,
        async: true,
        includer: this.createIncluder(),
        ...this.ejsOptions
      });
      
      // 如果设置了布局，则使用布局渲染
      if (templateData._layout) {
        const layoutContent = await this.getLayout(templateData._layout);
        const layoutData = {
          ...templateData,
          body: html
        };
        
        html = await ejs.render(layoutContent, layoutData, {
          filename: path.join(this.layoutPath, templateData._layout + '.ejs'),
          cache: this.ejsOptions.cache,
          compileDebug: this.buildConfig.template?.options?.compileDebug !== false,
          async: true,
          includer: this.createIncluder(),
          ...this.ejsOptions
        });
      }
      
      return html;
    } catch (error) {
      this.utils.log(`模板渲染失败: ${templateName} - ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 获取模板内容
   * @param {string} templateName - 模板名称
   * @returns {Promise<string>} 模板内容
   */
  async getTemplate(templateName) {
    // 检查缓存
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }
    
    // 查找模板文件
    const templatePath = await this.findTemplate(templateName);
    
    if (!templatePath) {
      throw new Error(`模板文件不存在: ${templateName}`);
    }
    
    // 读取模板内容
    const content = await fs.readFile(templatePath, 'utf-8');
    
    // 缓存模板内容
    if (this.buildConfig.template?.options?.cache !== false) {
      this.templateCache.set(templateName, content);
    }
    
    return content;
  }

  /**
   * 查找模板文件
   * @param {string} templateName - 模板名称
   * @returns {Promise<string|null>} 模板文件路径
   */
  async findTemplate(templateName) {
    const extensions = ['.ejs', '.html'];
    const searchPaths = [
      this.layoutPath,
      this.templatePath,
      path.join(this.templatePath, 'themes', this.siteConfig.theme?.name || 'default')
    ];
    
    for (const searchPath of searchPaths) {
      for (const ext of extensions) {
        const templatePath = path.join(searchPath, templateName + ext);
        
        if (await fs.pathExists(templatePath)) {
          return templatePath;
        }
      }
    }
    
    return null;
  }

  /**
   * 获取模板文件路径
   * @param {string} templateName - 模板名称
   * @returns {string} 模板文件路径
   */
  getTemplatePath(templateName) {
    return path.join(this.layoutPath, templateName + '.ejs');
  }

  /**
   * 准备模板数据
   * @param {object} data - 原始数据
   * @returns {Promise<object>} 处理后的模板数据
   */
  async prepareTemplateData(data) {
    const utils = this.createTemplateUtils();
    
    const templateData = {
      // 站点配置
      site: this.siteConfig,
      
      // 构建配置
      build: this.buildConfig,
      
      // 工具函数
      utils,
      
      // 将工具函数也添加到根级别
      ...utils,
      
      // 全局变量
      ...this.buildConfig.template?.globals,
      
      // 传入的数据
      ...data
    };
    
    // 添加layout函数
    templateData.layout = (layoutName) => {
      templateData._layout = layoutName;
      return '';
    };
    
    // 确保page对象存在
    if (!templateData.page) {
      templateData.page = {
        title: templateData.title || '',
        description: templateData.description || '',
        url: String(templateData.url || '/'),
        layout: data.layout || 'default'
      };
    } else {
      // 确保page.url是字符串
      templateData.page.url = String(templateData.page.url || '/');
      // 确保page.layout是字符串
      if (!templateData.page.layout) {
        templateData.page.layout = data.layout || 'default';
      }
    }
    
    // 确保content变量存在
    if (!templateData.content) {
      templateData.content = templateData.body || '';
    }
    
    return templateData;
  }

  /**
   * 创建模板工具函数
   * @returns {object} 工具函数集合
   */
  createTemplateUtils() {
    return {
      // 日期格式化
      formatDate: (date, format) => {
        const moment = require('moment');
        return moment(date).format(format || this.siteConfig.dateFormat);
      },
      
      // 相对时间
      timeAgo: (date) => {
        const moment = require('moment');
        return moment(date).fromNow();
      },
      
      // 截取文本
      excerpt: (text, length = 200) => {
        return this.utils.getExcerpt(text, null, length);
      },
      
      // 去除HTML标签
      stripHtml: (html) => {
        return this.utils.stripHtml(html);
      },
      
      // URL生成
      url: (path) => {
        if (path.startsWith('http')) {
          return path;
        }
        return this.siteConfig.url + (path.startsWith('/') ? path : '/' + path);
      },
      
      // 资源URL
      asset: (path) => {
        return path.startsWith('/') ? path : '/' + path;
      },
      
      // 分页链接
      paginate: (current, total, baseUrl) => {
        const pages = [];
        const maxPages = 5;
        
        let start = Math.max(1, current - Math.floor(maxPages / 2));
        let end = Math.min(total, start + maxPages - 1);
        
        if (end - start < maxPages - 1) {
          start = Math.max(1, end - maxPages + 1);
        }
        
        for (let i = start; i <= end; i++) {
          pages.push({
            number: i,
            url: i === 1 ? baseUrl : `${baseUrl}/page/${i}`,
            current: i === current
          });
        }
        
        return {
          pages,
          prev: current > 1 ? {
            number: current - 1,
            url: current - 1 === 1 ? baseUrl : `${baseUrl}/page/${current - 1}`
          } : null,
          next: current < total ? {
            number: current + 1,
            url: `${baseUrl}/page/${current + 1}`
          } : null
        };
      },
      
      // JSON序列化
      json: (obj) => {
        return JSON.stringify(obj);
      },
      
      // 首字母大写
      capitalize: (str) => {
        return this.utils.capitalize(str);
      },
      
      // Slug化
      slugify: (str) => {
        return this.utils.slugify(str);
      }
    };
  }

  /**
   * 创建include函数
   * @returns {Function} include函数
   */
  createIncluder() {
    return async (templatePath, data = {}) => {
      try {
        // 处理相对路径
        let fullPath;
        if (templatePath.startsWith('./') || templatePath.startsWith('../')) {
          fullPath = path.resolve(this.templatePath, templatePath);
        } else {
          fullPath = path.join(this.partialPath, templatePath);
        }
        
        // 添加扩展名
        if (!path.extname(fullPath)) {
          fullPath += '.ejs';
        }
        
        // 检查文件是否存在
        if (!await fs.pathExists(fullPath)) {
          throw new Error(`Include文件不存在: ${templatePath}`);
        }
        
        // 读取并渲染模板
        const content = await fs.readFile(fullPath, 'utf-8');
        return await ejs.render(content, data, {
          filename: fullPath,
          async: true,
          includer: this.createIncluder()
        });
      } catch (error) {
        this.utils.log(`Include失败: ${templatePath} - ${error.message}`, 'error');
        return `<!-- Include Error: ${templatePath} -->`;
      }
    };
  }

  /**
   * 获取布局模板
   * @param {string} layoutName - 布局名称
   * @returns {Promise<string>} 布局内容
   */
  async getLayout(layoutName) {
    // 检查缓存
    if (this.layoutCache.has(layoutName)) {
      return this.layoutCache.get(layoutName);
    }
    
    // 处理布局名称，如果包含路径分隔符，只取文件名部分
    const baseName = layoutName.includes('/') ? path.basename(layoutName) : layoutName;
    const layoutPath = path.join(this.layoutPath, baseName + '.ejs');
    
    if (!await fs.pathExists(layoutPath)) {
      throw new Error(`布局文件不存在: ${layoutName}`);
    }
    
    const content = await fs.readFile(layoutPath, 'utf-8');
    
    // 缓存布局内容
    if (this.buildConfig.template?.options?.cache !== false) {
      this.layoutCache.set(layoutName, content);
    }
    
    return content;
  }

  /**
   * 获取部分模板
   * @param {string} partialName - 部分模板名称
   * @returns {Promise<string>} 部分模板内容
   */
  async getPartial(partialName) {
    // 检查缓存
    if (this.partialCache.has(partialName)) {
      return this.partialCache.get(partialName);
    }
    
    const partialPath = path.join(this.partialPath, partialName + '.ejs');
    
    if (!await fs.pathExists(partialPath)) {
      throw new Error(`部分模板不存在: ${partialName}`);
    }
    
    const content = await fs.readFile(partialPath, 'utf-8');
    
    // 缓存部分模板内容
    if (this.buildConfig.template?.options?.cache !== false) {
      this.partialCache.set(partialName, content);
    }
    
    return content;
  }

  /**
   * 清除模板缓存
   */
  clearCache() {
    this.templateCache.clear();
    this.layoutCache.clear();
    this.partialCache.clear();
    
    // 清除EJS缓存
    ejs.clearCache();
    
    this.utils.log('模板缓存已清除', 'info');
  }

  /**
   * 预编译模板
   * @param {string} templateName - 模板名称
   * @returns {Promise<Function>} 编译后的模板函数
   */
  async compileTemplate(templateName) {
    const templateContent = await this.getTemplate(templateName);
    
    return ejs.compile(templateContent, {
      filename: this.getTemplatePath(templateName),
      cache: this.buildConfig.template?.options?.cache !== false,
      compileDebug: this.buildConfig.template?.options?.compileDebug !== false
    });
  }

  /**
   * 检查模板是否存在
   * @param {string} templateName - 模板名称
   * @returns {Promise<boolean>} 是否存在
   */
  async templateExists(templateName) {
    const templatePath = await this.findTemplate(templateName);
    return templatePath !== null;
  }

  /**
   * 获取所有可用模板
   * @returns {Promise<Array>} 模板列表
   */
  async getAvailableTemplates() {
    const templates = [];
    
    const searchPaths = [
      this.layoutPath,
      this.templatePath
    ];
    
    for (const searchPath of searchPaths) {
      if (await fs.pathExists(searchPath)) {
        const files = await fs.readdir(searchPath);
        
        for (const file of files) {
          if (file.endsWith('.ejs') || file.endsWith('.html')) {
            const templateName = path.basename(file, path.extname(file));
            if (!templates.includes(templateName)) {
              templates.push(templateName);
            }
          }
        }
      }
    }
    
    return templates.sort();
  }

  /**
   * 验证模板语法
   * @param {string} templateName - 模板名称
   * @returns {Promise<object>} 验证结果
   */
  async validateTemplate(templateName) {
    try {
      const templateContent = await this.getTemplate(templateName);
      
      // 尝试编译模板
      ejs.compile(templateContent, {
        filename: this.getTemplatePath(templateName)
      });
      
      return { valid: true, errors: [] };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          message: error.message,
          line: error.line || null,
          column: error.column || null
        }]
      };
    }
  }
}

module.exports = Template;