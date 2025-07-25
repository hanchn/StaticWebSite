const fs = require('fs-extra');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const hljs = require('highlight.js');
const Utils = require('./utils');

/**
 * 内容处理器
 * 负责Markdown文件的解析、Front Matter提取和内容转换
 */
class Processor {
  constructor(config = {}) {
    this.config = config;
    this.utils = new Utils();
    
    // 配置marked
    this.setupMarked();
    
    // 内容缓存
    this.cache = new Map();
    this.cacheEnabled = config.cache !== false;
  }

  /**
   * 配置marked解析器
   */
  setupMarked() {
    const markedConfig = this.config.markdown || {};
    
    // 设置渲染器
    const renderer = new marked.Renderer();
    
    // 自定义标题渲染（添加锚点）
    renderer.heading = (text, level) => {
      const anchor = this.utils.slugify(text);
      return `<h${level} id="${anchor}"><a href="#${anchor}" class="header-anchor">#</a> ${text}</h${level}>\n`;
    };
    
    // 自定义代码块渲染（语法高亮）
    renderer.code = (code, language) => {
      if (language && hljs.getLanguage(language)) {
        try {
          const highlighted = hljs.highlight(code, { language }).value;
          return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>\n`;
        } catch (error) {
          this.utils.log(`语法高亮失败: ${language} - ${error.message}`, 'warn');
        }
      }
      
      return `<pre><code class="hljs">${this.escapeHtml(code)}</code></pre>\n`;
    };
    
    // 自定义链接渲染（处理内部链接）
    renderer.link = (href, title, text) => {
      const isExternal = /^https?:\/\//.test(href);
      const target = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
      const titleAttr = title ? ` title="${title}"` : '';
      
      return `<a href="${href}"${titleAttr}${target}>${text}</a>`;
    };
    
    // 自定义图片渲染（处理相对路径）
    renderer.image = (href, title, text) => {
      const titleAttr = title ? ` title="${title}"` : '';
      const altAttr = text ? ` alt="${text}"` : '';
      
      // 处理相对路径图片
      if (!href.startsWith('http') && !href.startsWith('/')) {
        href = this.resolveImagePath(href);
      }
      
      return `<img src="${href}"${altAttr}${titleAttr} loading="lazy">`;
    };
    
    // 配置marked选项
    marked.setOptions({
      renderer,
      gfm: markedConfig.gfm !== false,
      breaks: markedConfig.breaks === true,
      pedantic: markedConfig.pedantic === true,
      sanitize: markedConfig.sanitize === true,
      smartLists: markedConfig.smartLists !== false,
      smartypants: markedConfig.smartypants === true,
      ...markedConfig.options
    });
  }

  /**
   * 处理单个Markdown文件
   * @param {string} filePath - 文件路径
   * @param {object} options - 处理选项
   * @returns {Promise<object>} 处理结果
   */
  async processFile(filePath, options = {}) {
    const {
      baseDir = '',
      urlPath = '',
      skipCache = false
    } = options;
    
    // 检查缓存
    const cacheKey = `${filePath}:${JSON.stringify(options)}`;
    if (this.cacheEnabled && !skipCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      
      // 检查文件是否已修改
      const stats = await this.utils.getFileStats(filePath);
      if (stats && cached.modified >= stats.modified) {
        return cached.data;
      }
    }
    
    try {
      // 读取文件内容
      const content = await this.utils.readFile(filePath);
      
      // 解析Front Matter
      const parsed = matter(content);
      
      // 获取文件信息
      const fileInfo = this.getFileInfo(filePath, baseDir);
      
      // 处理内容
      const processedContent = await this.processContent(parsed.content, filePath);
      
      // 构建结果对象
      const result = {
        // 文件信息
        ...fileInfo,
        
        // Front Matter数据
        ...parsed.data,
        
        // 内容
        content: processedContent.html,
        excerpt: processedContent.excerpt,
        wordCount: processedContent.wordCount,
        readingTime: processedContent.readingTime,
        
        // 元数据
        raw: parsed.content,
        frontMatter: parsed.data,
        
        // URL信息
        url: urlPath || this.generateUrl(fileInfo, parsed.data),
        
        // 处理时间
        processed: new Date()
      };
      
      // 后处理
      await this.postProcess(result, filePath);
      
      // 缓存结果
      if (this.cacheEnabled) {
        const stats = await this.utils.getFileStats(filePath);
        this.cache.set(cacheKey, {
          data: result,
          modified: stats ? stats.modified : new Date()
        });
      }
      
      return result;
      
    } catch (error) {
      this.utils.log(`处理文件失败: ${filePath} - ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * 批量处理文件
   * @param {Array} filePaths - 文件路径数组
   * @param {object} options - 处理选项
   * @returns {Promise<Array>} 处理结果数组
   */
  async processFiles(filePaths, options = {}) {
    const { concurrency = 5 } = options;
    
    const tasks = filePaths.map(filePath => 
      () => this.processFile(filePath, options)
    );
    
    return await this.utils.limitConcurrency(tasks, concurrency);
  }

  /**
   * 处理内容
   * @param {string} content - Markdown内容
   * @param {string} filePath - 文件路径
   * @returns {Promise<object>} 处理结果
   */
  async processContent(content, filePath) {
    // 预处理内容
    const preprocessed = await this.preprocessContent(content, filePath);
    
    // 转换为HTML
    const html = marked(preprocessed);
    
    // 生成摘要
    const excerpt = this.generateExcerpt(preprocessed);
    
    // 计算字数和阅读时间
    const wordCount = this.countWords(preprocessed);
    const readingTime = this.calculateReadingTime(wordCount);
    
    return {
      html,
      excerpt,
      wordCount,
      readingTime
    };
  }

  /**
   * 预处理内容
   * @param {string} content - 原始内容
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} 预处理后的内容
   */
  async preprocessContent(content, filePath) {
    let processed = content;
    
    // 处理相对路径图片
    processed = this.processImages(processed, filePath);
    
    // 处理内部链接
    processed = this.processInternalLinks(processed, filePath);
    
    // 处理自定义标签
    processed = await this.processCustomTags(processed, filePath);
    
    return processed;
  }

  /**
   * 处理图片路径
   * @param {string} content - 内容
   * @param {string} filePath - 文件路径
   * @returns {string} 处理后的内容
   */
  processImages(content, filePath) {
    const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    
    return content.replace(imageRegex, (match, alt, src) => {
      // 跳过外部链接
      if (src.startsWith('http') || src.startsWith('/')) {
        return match;
      }
      
      // 解析相对路径
      const resolvedSrc = this.resolveImagePath(src, filePath);
      return `![${alt}](${resolvedSrc})`;
    });
  }

  /**
   * 处理内部链接
   * @param {string} content - 内容
   * @param {string} filePath - 文件路径
   * @returns {string} 处理后的内容
   */
  processInternalLinks(content, filePath) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    return content.replace(linkRegex, (match, text, href) => {
      // 跳过外部链接和锚点
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('/')) {
        return match;
      }
      
      // 处理.md文件链接
      if (href.endsWith('.md')) {
        const resolvedHref = this.resolveLinkPath(href, filePath);
        return `[${text}](${resolvedHref})`;
      }
      
      return match;
    });
  }

  /**
   * 处理自定义标签
   * @param {string} content - 内容
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} 处理后的内容
   */
  async processCustomTags(content, filePath) {
    let processed = content;
    
    // 处理include标签
    processed = await this.processIncludeTags(processed, filePath);
    
    // 处理代码块标签
    processed = await this.processCodeTags(processed, filePath);
    
    return processed;
  }

  /**
   * 处理include标签
   * @param {string} content - 内容
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} 处理后的内容
   */
  async processIncludeTags(content, filePath) {
    const includeRegex = /{% include ([^%]+) %}/g;
    let match;
    let processed = content;
    
    while ((match = includeRegex.exec(content)) !== null) {
      const includePath = match[1].trim();
      const fullIncludePath = path.resolve(path.dirname(filePath), includePath);
      
      try {
        if (await this.utils.pathExists(fullIncludePath)) {
          const includeContent = await this.utils.readFile(fullIncludePath);
          processed = processed.replace(match[0], includeContent);
        } else {
          this.utils.log(`Include文件不存在: ${includePath}`, 'warn');
          processed = processed.replace(match[0], `<!-- Include not found: ${includePath} -->`);
        }
      } catch (error) {
        this.utils.log(`Include处理失败: ${includePath} - ${error.message}`, 'error');
        processed = processed.replace(match[0], `<!-- Include error: ${includePath} -->`);
      }
    }
    
    return processed;
  }

  /**
   * 处理代码块标签
   * @param {string} content - 内容
   * @param {string} filePath - 文件路径
   * @returns {Promise<string>} 处理后的内容
   */
  async processCodeTags(content, filePath) {
    const codeRegex = /{% code ([^%]+) %}/g;
    let match;
    let processed = content;
    
    while ((match = codeRegex.exec(content)) !== null) {
      const codePath = match[1].trim();
      const fullCodePath = path.resolve(path.dirname(filePath), codePath);
      
      try {
        if (await this.utils.pathExists(fullCodePath)) {
          const codeContent = await this.utils.readFile(fullCodePath);
          const ext = path.extname(codePath).substring(1);
          const codeBlock = `\`\`\`${ext}\n${codeContent}\n\`\`\``;
          processed = processed.replace(match[0], codeBlock);
        } else {
          this.utils.log(`代码文件不存在: ${codePath}`, 'warn');
          processed = processed.replace(match[0], `<!-- Code file not found: ${codePath} -->`);
        }
      } catch (error) {
        this.utils.log(`代码块处理失败: ${codePath} - ${error.message}`, 'error');
        processed = processed.replace(match[0], `<!-- Code error: ${codePath} -->`);
      }
    }
    
    return processed;
  }

  /**
   * 获取文件信息
   * @param {string} filePath - 文件路径
   * @param {string} baseDir - 基础目录
   * @returns {object} 文件信息
   */
  getFileInfo(filePath, baseDir = '') {
    const relativePath = baseDir ? path.relative(baseDir, filePath) : filePath;
    const parsed = path.parse(relativePath);
    
    return {
      path: filePath,
      relativePath,
      dir: parsed.dir,
      name: parsed.name,
      ext: parsed.ext,
      slug: this.utils.slugify(parsed.name)
    };
  }

  /**
   * 生成URL
   * @param {object} fileInfo - 文件信息
   * @param {object} frontMatter - Front Matter数据
   * @returns {string} URL
   */
  generateUrl(fileInfo, frontMatter = {}) {
    // 使用Front Matter中的permalink
    if (frontMatter.permalink) {
      return frontMatter.permalink;
    }
    
    // 根据文件路径生成URL
    const segments = fileInfo.dir ? fileInfo.dir.split(path.sep) : [];
    segments.push(fileInfo.slug);
    
    return '/' + segments.filter(Boolean).join('/');
  }

  /**
   * 生成摘要
   * @param {string} content - 内容
   * @param {number} length - 摘要长度
   * @returns {string} 摘要
   */
  generateExcerpt(content, length = 200) {
    // 移除Markdown标记
    const plainText = content
      .replace(/#{1,6}\s+/g, '')           // 标题
      .replace(/\*\*([^*]+)\*\*/g, '$1')   // 粗体
      .replace(/\*([^*]+)\*/g, '$1')       // 斜体
      .replace(/`([^`]+)`/g, '$1')        // 行内代码
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // 图片
      .replace(/```[\s\S]*?```/g, '')     // 代码块
      .replace(/\n+/g, ' ')               // 换行
      .trim();
    
    return plainText.length > length 
      ? plainText.substring(0, length) + '...'
      : plainText;
  }

  /**
   * 计算字数
   * @param {string} content - 内容
   * @returns {number} 字数
   */
  countWords(content) {
    // 移除Markdown标记和代码块
    const plainText = content
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]+`/g, '')
      .replace(/#{1,6}\s+/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      .replace(/\n+/g, ' ')
      .trim();
    
    // 中英文混合计数
    const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishWords = (plainText.replace(/[\u4e00-\u9fa5]/g, '').match(/\b\w+\b/g) || []).length;
    
    return chineseChars + englishWords;
  }

  /**
   * 计算阅读时间
   * @param {number} wordCount - 字数
   * @returns {number} 阅读时间（分钟）
   */
  calculateReadingTime(wordCount) {
    const wordsPerMinute = 200; // 平均阅读速度
    return Math.ceil(wordCount / wordsPerMinute);
  }

  /**
   * 解析图片路径
   * @param {string} src - 图片源路径
   * @param {string} filePath - 当前文件路径
   * @returns {string} 解析后的路径
   */
  resolveImagePath(src, filePath) {
    if (!filePath) return src;
    
    const fileDir = path.dirname(filePath);
    const resolved = path.resolve(fileDir, src);
    
    // 转换为相对于项目根目录的路径
    const projectRoot = process.cwd();
    const relativePath = path.relative(projectRoot, resolved);
    
    return '/' + relativePath.replace(/\\/g, '/');
  }

  /**
   * 解析链接路径
   * @param {string} href - 链接路径
   * @param {string} filePath - 当前文件路径
   * @returns {string} 解析后的路径
   */
  resolveLinkPath(href, filePath) {
    if (!filePath) return href;
    
    // 移除.md扩展名
    const withoutExt = href.replace(/\.md$/, '');
    
    // 如果是相对路径，解析为绝对路径
    if (!withoutExt.startsWith('/')) {
      const fileDir = path.dirname(filePath);
      const resolved = path.resolve(fileDir, withoutExt);
      const projectRoot = process.cwd();
      const relativePath = path.relative(projectRoot, resolved);
      return '/' + relativePath.replace(/\\/g, '/');
    }
    
    return withoutExt;
  }

  /**
   * 后处理
   * @param {object} result - 处理结果
   * @param {string} filePath - 文件路径
   */
  async postProcess(result, filePath) {
    // 设置默认值
    if (!result.title) {
      result.title = result.name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
    
    if (!result.date) {
      const stats = await this.utils.getFileStats(filePath);
      result.date = stats ? stats.modified : new Date();
    }
    
    if (!result.updated) {
      result.updated = result.date;
    }
    
    // 处理标签和分类
    if (result.tags && typeof result.tags === 'string') {
      result.tags = result.tags.split(',').map(tag => tag.trim());
    }
    
    if (result.categories && typeof result.categories === 'string') {
      result.categories = result.categories.split(',').map(cat => cat.trim());
    }
    
    // 确保数组格式
    result.tags = result.tags || [];
    result.categories = result.categories || [];
  }

  /**
   * 转义HTML
   * @param {string} text - 文本
   * @returns {string} 转义后的文本
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * 清除缓存
   * @param {string} pattern - 清除模式（可选）
   */
  clearCache(pattern) {
    if (pattern) {
      const regex = new RegExp(pattern);
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * 获取缓存统计
   * @returns {object} 缓存统计
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      enabled: this.cacheEnabled
    };
  }
}

module.exports = Processor;