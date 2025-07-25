const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');
const glob = require('glob');
const globAsync = promisify(glob);

/**
 * 工具类
 * 提供日志记录、文件操作、字符串处理等通用功能
 */
class Utils {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  /**
   * 日志记录
   * @param {string} message - 日志消息
   * @param {string} level - 日志级别
   * @param {object} meta - 额外信息
   */
  log(message, level = 'info', meta = {}) {
    const currentLevel = this.logLevels[this.logLevel] || 2;
    const messageLevel = this.logLevels[level] || 2;
    
    if (messageLevel <= currentLevel) {
      const timestamp = new Date().toISOString();
      const prefix = this.getLogPrefix(level);
      
      console.log(`${prefix}[${timestamp}] ${message}`);
      
      if (Object.keys(meta).length > 0) {
        console.log('  Meta:', meta);
      }
    }
  }

  /**
   * 获取日志前缀
   * @param {string} level - 日志级别
   * @returns {string} 前缀
   */
  getLogPrefix(level) {
    const prefixes = {
      error: '❌ ',
      warn: '⚠️  ',
      info: 'ℹ️  ',
      debug: '🐛 '
    };
    
    return prefixes[level] || 'ℹ️  ';
  }

  /**
   * 生成唯一ID
   * @param {number} length - ID长度
   * @returns {string} 唯一ID
   */
  generateId(length = 8) {
    return crypto.randomBytes(length).toString('hex').substring(0, length);
  }

  /**
   * 生成文件哈希
   * @param {string} filePath - 文件路径
   * @param {string} algorithm - 哈希算法
   * @returns {Promise<string>} 文件哈希
   */
  async generateFileHash(filePath, algorithm = 'md5') {
    const content = await fs.readFile(filePath);
    return crypto.createHash(algorithm).update(content).digest('hex');
  }

  /**
   * 生成内容哈希
   * @param {string} content - 内容
   * @param {string} algorithm - 哈希算法
   * @returns {string} 内容哈希
   */
  generateContentHash(content, algorithm = 'md5') {
    return crypto.createHash(algorithm).update(content).digest('hex');
  }

  /**
   * 格式化文件大小
   * @param {number} bytes - 字节数
   * @returns {string} 格式化后的大小
   */
  formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * 格式化时间
   * @param {Date|string} date - 日期
   * @param {string} format - 格式
   * @returns {string} 格式化后的时间
   */
  formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    const d = new Date(date);
    
    const formatMap = {
      YYYY: d.getFullYear(),
      MM: String(d.getMonth() + 1).padStart(2, '0'),
      DD: String(d.getDate()).padStart(2, '0'),
      HH: String(d.getHours()).padStart(2, '0'),
      mm: String(d.getMinutes()).padStart(2, '0'),
      ss: String(d.getSeconds()).padStart(2, '0')
    };
    
    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => formatMap[match]);
  }

  /**
   * 生成URL友好的slug
   * @param {string} text - 原始文本
   * @returns {string} slug
   */
  slugify(text) {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')           // 空格替换为连字符
      .replace(/[^\w\-]+/g, '')       // 移除非字母数字字符
      .replace(/\-\-+/g, '-')         // 多个连字符替换为单个
      .replace(/^-+/, '')             // 移除开头的连字符
      .replace(/-+$/, '');            // 移除结尾的连字符
  }

  /**
   * 深度合并对象
   * @param {object} target - 目标对象
   * @param {...object} sources - 源对象
   * @returns {object} 合并后的对象
   */
  deepMerge(target, ...sources) {
    if (!sources.length) return target;
    const source = sources.shift();
    
    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }
    
    return this.deepMerge(target, ...sources);
  }

  /**
   * 检查是否为对象
   * @param {any} item - 检查项
   * @returns {boolean} 是否为对象
   */
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * 深度克隆对象
   * @param {any} obj - 要克隆的对象
   * @returns {any} 克隆后的对象
   */
  deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }
    
    if (obj instanceof Date) {
      return new Date(obj.getTime());
    }
    
    if (obj instanceof Array) {
      return obj.map(item => this.deepClone(item));
    }
    
    if (typeof obj === 'object') {
      const cloned = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          cloned[key] = this.deepClone(obj[key]);
        }
      }
      return cloned;
    }
    
    return obj;
  }

  /**
   * 确保目录存在
   * @param {string} dirPath - 目录路径
   */
  async ensureDir(dirPath) {
    await fs.ensureDir(dirPath);
  }

  /**
   * 复制文件或目录
   * @param {string} src - 源路径
   * @param {string} dest - 目标路径
   * @param {object} options - 选项
   */
  async copy(src, dest, options = {}) {
    await fs.copy(src, dest, options);
  }

  /**
   * 移动文件或目录
   * @param {string} src - 源路径
   * @param {string} dest - 目标路径
   */
  async move(src, dest) {
    await fs.move(src, dest);
  }

  /**
   * 删除文件或目录
   * @param {string} targetPath - 目标路径
   */
  async remove(targetPath) {
    await fs.remove(targetPath);
  }

  /**
   * 检查路径是否存在
   * @param {string} targetPath - 目标路径
   * @returns {Promise<boolean>} 是否存在
   */
  async pathExists(targetPath) {
    return await fs.pathExists(targetPath);
  }

  /**
   * 读取JSON文件
   * @param {string} filePath - 文件路径
   * @returns {Promise<object>} JSON对象
   */
  async readJson(filePath) {
    try {
      return await fs.readJson(filePath);
    } catch (error) {
      this.log(`读取JSON文件失败: ${filePath} - ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * 写入JSON文件
   * @param {string} filePath - 文件路径
   * @param {object} data - 数据
   * @param {object} options - 选项
   */
  async writeJson(filePath, data, options = { spaces: 2 }) {
    await this.ensureDir(path.dirname(filePath));
    await fs.writeJson(filePath, data, options);
  }

  /**
   * 读取文件内容
   * @param {string} filePath - 文件路径
   * @param {string} encoding - 编码
   * @returns {Promise<string>} 文件内容
   */
  async readFile(filePath, encoding = 'utf8') {
    return await fs.readFile(filePath, encoding);
  }

  /**
   * 写入文件内容
   * @param {string} filePath - 文件路径
   * @param {string} content - 内容
   * @param {string} encoding - 编码
   */
  async writeFile(filePath, content, encoding = 'utf8') {
    await this.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, encoding);
  }

  /**
   * 获取文件统计信息
   * @param {string} filePath - 文件路径
   * @returns {Promise<object>} 统计信息
   */
  async getFileStats(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * 使用glob模式查找文件
   * @param {string} pattern - glob模式
   * @param {object} options - 选项
   * @returns {Promise<Array>} 匹配的文件列表
   */
  async glob(pattern, options = {}) {
    return await globAsync(pattern, options);
  }

  /**
   * 递归读取目录
   * @param {string} dirPath - 目录路径
   * @param {object} options - 选项
   * @returns {Promise<Array>} 文件列表
   */
  async readDirRecursive(dirPath, options = {}) {
    const {
      extensions = [],
      ignore = [],
      includeStats = false
    } = options;
    
    const files = [];
    
    const processDir = async (currentPath) => {
      const items = await fs.readdir(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const relativePath = path.relative(dirPath, itemPath);
        
        // 检查是否应该忽略
        if (ignore.some(pattern => relativePath.includes(pattern))) {
          continue;
        }
        
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          await processDir(itemPath);
        } else if (stats.isFile()) {
          // 检查文件扩展名
          if (extensions.length === 0 || extensions.includes(path.extname(item))) {
            const fileInfo = {
              path: itemPath,
              relativePath,
              name: item,
              ext: path.extname(item)
            };
            
            if (includeStats) {
              fileInfo.stats = {
                size: stats.size,
                created: stats.birthtime,
                modified: stats.mtime
              };
            }
            
            files.push(fileInfo);
          }
        }
      }
    };
    
    await processDir(dirPath);
    return files;
  }

  /**
   * 清理目录（保留目录结构，删除文件）
   * @param {string} dirPath - 目录路径
   * @param {object} options - 选项
   */
  async cleanDir(dirPath, options = {}) {
    const { keepDirs = true, ignore = [] } = options;
    
    if (!(await this.pathExists(dirPath))) {
      return;
    }
    
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      
      // 检查是否应该忽略
      if (ignore.includes(item)) {
        continue;
      }
      
      const stats = await fs.stat(itemPath);
      
      if (stats.isDirectory()) {
        if (keepDirs) {
          await this.cleanDir(itemPath, options);
        } else {
          await fs.remove(itemPath);
        }
      } else {
        await fs.remove(itemPath);
      }
    }
  }

  /**
   * 获取相对路径
   * @param {string} from - 起始路径
   * @param {string} to - 目标路径
   * @returns {string} 相对路径
   */
  getRelativePath(from, to) {
    return path.relative(from, to);
  }

  /**
   * 规范化路径
   * @param {string} targetPath - 路径
   * @returns {string} 规范化后的路径
   */
  normalizePath(targetPath) {
    return path.normalize(targetPath).replace(/\\/g, '/');
  }

  /**
   * 解析路径
   * @param {string} targetPath - 路径
   * @returns {object} 路径信息
   */
  parsePath(targetPath) {
    const parsed = path.parse(targetPath);
    return {
      root: parsed.root,
      dir: parsed.dir,
      base: parsed.base,
      ext: parsed.ext,
      name: parsed.name
    };
  }

  /**
   * 延迟执行
   * @param {number} ms - 延迟毫秒数
   * @returns {Promise} Promise对象
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 重试执行函数
   * @param {Function} fn - 要执行的函数
   * @param {number} maxRetries - 最大重试次数
   * @param {number} delay - 重试间隔
   * @returns {Promise} 执行结果
   */
  async retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (i < maxRetries) {
          this.log(`重试 ${i + 1}/${maxRetries}: ${error.message}`, 'warn');
          await this.delay(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 限制并发执行
   * @param {Array} tasks - 任务数组
   * @param {number} concurrency - 并发数
   * @returns {Promise<Array>} 执行结果
   */
  async limitConcurrency(tasks, concurrency = 5) {
    const results = [];
    const executing = [];
    
    for (const task of tasks) {
      const promise = Promise.resolve().then(() => task()).then(result => {
        executing.splice(executing.indexOf(promise), 1);
        return result;
      });
      
      results.push(promise);
      
      if (tasks.length >= concurrency) {
        executing.push(promise);
        
        if (executing.length >= concurrency) {
          await Promise.race(executing);
        }
      }
    }
    
    return Promise.all(results);
  }

  /**
   * 防抖函数
   * @param {Function} fn - 要防抖的函数
   * @param {number} delay - 延迟时间
   * @returns {Function} 防抖后的函数
   */
  debounce(fn, delay = 300) {
    let timeoutId;
    
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  /**
   * 节流函数
   * @param {Function} fn - 要节流的函数
   * @param {number} delay - 延迟时间
   * @returns {Function} 节流后的函数
   */
  throttle(fn, delay = 300) {
    let lastCall = 0;
    
    return function (...args) {
      const now = Date.now();
      
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn.apply(this, args);
      }
    };
  }

  /**
   * 获取目录下的Markdown文件
   * @param {string} dirPath - 目录路径
   * @returns {Promise<Array>} Markdown文件路径列表
   */
  async getMarkdownFiles(dirPath) {
    if (!(await this.pathExists(dirPath))) {
      return [];
    }
    
    const pattern = path.join(dirPath, '**/*.{md,markdown}').replace(/\\/g, '/');
    return await this.glob(pattern);
  }

  /**
   * 获取文件的创建/修改日期
   * @param {string} filePath - 文件路径
   * @returns {Promise<Date>} 文件日期
   */
  async getFileDate(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.mtime || stats.birthtime || new Date();
    } catch (error) {
      return new Date();
    }
  }

  /**
   * 从文件路径生成slug
   * @param {string} filePath - 文件路径
   * @returns {string} slug
   */
  getSlug(filePath) {
    const basename = path.basename(filePath, path.extname(filePath));
    return this.slugify(basename);
  }

  /**
   * 提取文章摘要
   * @param {string} content - 文章内容
   * @param {string} customExcerpt - 自定义摘要
   * @param {number} length - 摘要长度
   * @returns {string} 摘要
   */
  getExcerpt(content, customExcerpt, length = 200) {
    if (customExcerpt) {
      return customExcerpt;
    }
    
    // 移除Markdown语法
    const plainText = content
      .replace(/#{1,6}\s+/g, '') // 标题
      .replace(/\*\*(.*?)\*\*/g, '$1') // 粗体
      .replace(/\*(.*?)\*/g, '$1') // 斜体
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // 链接
      .replace(/`([^`]+)`/g, '$1') // 行内代码
      .replace(/```[\s\S]*?```/g, '') // 代码块
      .replace(/\n+/g, ' ') // 换行
      .trim();
    
    return plainText.length > length 
       ? plainText.substring(0, length) + '...'
       : plainText;
   }

   /**
    * 移除HTML标签
    * @param {string} html - HTML内容
    * @returns {string} 纯文本
    */
   stripHtml(html) {
     if (!html) return '';
     return html.replace(/<[^>]*>/g, '').trim();
   }

   /**
    * 首字母大写
    * @param {string} str - 字符串
    * @returns {string} 首字母大写的字符串
    */
   capitalize(str) {
     if (!str) return '';
     return str.charAt(0).toUpperCase() + str.slice(1);
   }
 }
 
 module.exports = Utils;