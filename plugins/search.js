const fs = require('fs-extra');
const path = require('path');
const Utils = require('../lib/utils');

/**
 * 搜索插件
 * 生成搜索索引和搜索API
 */
class SearchPlugin {
  constructor(config = {}) {
    this.name = 'search';
    this.version = '1.0.0';
    this.config = {
      enabled: true,
      indexFields: ['title', 'content', 'excerpt', 'tags', 'categories'],
      searchFields: ['title', 'content', 'excerpt'],
      minLength: 2,
      maxResults: 50,
      includeScore: true,
      ...config
    };
    
    this.utils = new Utils();
    this.searchIndex = [];
  }

  /**
   * 插件钩子
   */
  get hooks() {
    return {
      'after:scan': [this.buildSearchIndex.bind(this)],
      'after:build': [this.generateSearchFiles.bind(this)]
    };
  }

  /**
   * 初始化插件
   */
  async init(config) {
    this.config = { ...this.config, ...config };
    this.utils.log('搜索插件已初始化', 'info');
  }

  /**
   * 构建搜索索引
   * @param {object} data - 扫描数据
   */
  async buildSearchIndex(data) {
    if (!this.config.enabled) {
      return data;
    }

    this.utils.log('构建搜索索引...', 'info');
    
    this.searchIndex = [];
    
    // 处理文章
    if (data.posts) {
      for (const post of data.posts) {
        this.addToIndex(post, 'post');
      }
    }
    
    // 处理页面
    if (data.pages) {
      for (const page of data.pages) {
        this.addToIndex(page, 'page');
      }
    }
    
    // 处理文档
    if (data.docs) {
      for (const doc of data.docs) {
        this.addToIndex(doc, 'doc');
      }
    }
    
    this.utils.log(`搜索索引构建完成，共 ${this.searchIndex.length} 项`, 'info');
    
    return data;
  }

  /**
   * 添加内容到索引
   * @param {object} item - 内容项
   * @param {string} type - 内容类型
   */
  addToIndex(item, type) {
    // 跳过草稿
    if (item.draft) {
      return;
    }
    
    const indexItem = {
      id: this.generateId(item),
      type,
      url: item.url,
      title: item.title || '',
      excerpt: item.excerpt || '',
      date: item.date,
      tags: item.tags || [],
      categories: item.categories || []
    };
    
    // 添加搜索字段
    for (const field of this.config.indexFields) {
      if (item[field]) {
        if (Array.isArray(item[field])) {
          indexItem[field] = item[field].join(' ');
        } else {
          indexItem[field] = String(item[field]);
        }
      }
    }
    
    // 生成搜索文本
    indexItem.searchText = this.generateSearchText(indexItem);
    
    this.searchIndex.push(indexItem);
  }

  /**
   * 生成唯一ID
   * @param {object} item - 内容项
   * @returns {string} ID
   */
  generateId(item) {
    const source = `${item.url}-${item.title}-${item.date}`;
    return this.utils.generateContentHash(source, 'md5').substring(0, 8);
  }

  /**
   * 生成搜索文本
   * @param {object} item - 索引项
   * @returns {string} 搜索文本
   */
  generateSearchText(item) {
    const texts = [];
    
    for (const field of this.config.searchFields) {
      if (item[field]) {
        texts.push(item[field]);
      }
    }
    
    return texts.join(' ').toLowerCase();
  }

  /**
   * 生成搜索文件
   * @param {object} buildData - 构建数据
   */
  async generateSearchFiles(buildData) {
    if (!this.config.enabled || this.searchIndex.length === 0) {
      return buildData;
    }

    const outputDir = buildData.config.build.output;
    
    // 生成搜索索引文件
    await this.generateSearchIndex(outputDir);
    
    // 生成搜索API
    await this.generateSearchAPI(outputDir);
    
    // 生成搜索页面
    await this.generateSearchPage(outputDir, buildData);
    
    return buildData;
  }

  /**
   * 生成搜索索引文件
   * @param {string} outputDir - 输出目录
   */
  async generateSearchIndex(outputDir) {
    const indexPath = path.join(outputDir, 'search', 'index.json');
    
    // 简化索引数据（移除内容字段以减小文件大小）
    const simplifiedIndex = this.searchIndex.map(item => ({
      id: item.id,
      type: item.type,
      url: item.url,
      title: item.title,
      excerpt: item.excerpt,
      date: item.date,
      tags: item.tags,
      categories: item.categories
    }));
    
    await this.utils.writeJson(indexPath, {
      version: '1.0',
      generated: new Date().toISOString(),
      total: simplifiedIndex.length,
      index: simplifiedIndex
    });
    
    this.utils.log(`搜索索引已生成: ${indexPath}`, 'info');
  }

  /**
   * 生成搜索API
   * @param {string} outputDir - 输出目录
   */
  async generateSearchAPI(outputDir) {
    const apiDir = path.join(outputDir, 'api');
    
    // 生成搜索API脚本
    const searchScript = this.generateSearchScript();
    const scriptPath = path.join(apiDir, 'search.js');
    
    await this.utils.writeFile(scriptPath, searchScript);
    
    // 生成完整搜索数据（包含搜索文本）
    const fullIndexPath = path.join(apiDir, 'search-data.json');
    await this.utils.writeJson(fullIndexPath, {
      version: '1.0',
      generated: new Date().toISOString(),
      config: {
        minLength: this.config.minLength,
        maxResults: this.config.maxResults,
        includeScore: this.config.includeScore
      },
      data: this.searchIndex
    });
    
    this.utils.log(`搜索API已生成: ${apiDir}`, 'info');
  }

  /**
   * 生成搜索脚本
   * @returns {string} JavaScript代码
   */
  generateSearchScript() {
    return `
/**
 * 客户端搜索功能
 */
class BlogSearch {
  constructor(config = {}) {
    this.config = {
      minLength: ${this.config.minLength},
      maxResults: ${this.config.maxResults},
      includeScore: ${this.config.includeScore},
      ...config
    };
    
    this.searchData = null;
    this.isLoaded = false;
  }
  
  /**
   * 加载搜索数据
   */
  async loadSearchData() {
    if (this.isLoaded) {
      return;
    }
    
    try {
      const response = await fetch('/api/search-data.json');
      const data = await response.json();
      this.searchData = data.data;
      this.isLoaded = true;
    } catch (error) {
      console.error('加载搜索数据失败:', error);
      throw error;
    }
  }
  
  /**
   * 执行搜索
   * @param {string} query - 搜索查询
   * @returns {Array} 搜索结果
   */
  async search(query) {
    if (!query || query.length < this.config.minLength) {
      return [];
    }
    
    await this.loadSearchData();
    
    if (!this.searchData) {
      return [];
    }
    
    const normalizedQuery = query.toLowerCase().trim();
    const results = [];
    
    for (const item of this.searchData) {
      const score = this.calculateScore(item, normalizedQuery);
      
      if (score > 0) {
        const result = {
          ...item,
          searchText: undefined // 移除搜索文本
        };
        
        if (this.config.includeScore) {
          result.score = score;
        }
        
        results.push(result);
      }
    }
    
    // 按分数排序
    results.sort((a, b) => (b.score || 0) - (a.score || 0));
    
    // 限制结果数量
    return results.slice(0, this.config.maxResults);
  }
  
  /**
   * 计算搜索分数
   * @param {object} item - 搜索项
   * @param {string} query - 查询字符串
   * @returns {number} 分数
   */
  calculateScore(item, query) {
    let score = 0;
    
    // 标题匹配（权重最高）
    if (item.title && item.title.toLowerCase().includes(query)) {
      score += 10;
      
      // 完全匹配额外加分
      if (item.title.toLowerCase() === query) {
        score += 20;
      }
    }
    
    // 摘要匹配
    if (item.excerpt && item.excerpt.toLowerCase().includes(query)) {
      score += 5;
    }
    
    // 标签匹配
    if (item.tags) {
      for (const tag of item.tags) {
        if (tag.toLowerCase().includes(query)) {
          score += 3;
        }
      }
    }
    
    // 分类匹配
    if (item.categories) {
      for (const category of item.categories) {
        if (category.toLowerCase().includes(query)) {
          score += 3;
        }
      }
    }
    
    // 内容匹配（权重较低）
    if (item.searchText && item.searchText.includes(query)) {
      score += 1;
    }
    
    return score;
  }
  
  /**
   * 获取搜索建议
   * @param {string} query - 查询字符串
   * @returns {Array} 建议列表
   */
  async getSuggestions(query) {
    if (!query || query.length < 2) {
      return [];
    }
    
    await this.loadSearchData();
    
    if (!this.searchData) {
      return [];
    }
    
    const suggestions = new Set();
    const normalizedQuery = query.toLowerCase();
    
    for (const item of this.searchData) {
      // 从标题提取建议
      if (item.title) {
        const words = item.title.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.startsWith(normalizedQuery) && word.length > normalizedQuery.length) {
            suggestions.add(word);
          }
        }
      }
      
      // 从标签提取建议
      if (item.tags) {
        for (const tag of item.tags) {
          if (tag.toLowerCase().startsWith(normalizedQuery)) {
            suggestions.add(tag);
          }
        }
      }
      
      // 从分类提取建议
      if (item.categories) {
        for (const category of item.categories) {
          if (category.toLowerCase().startsWith(normalizedQuery)) {
            suggestions.add(category);
          }
        }
      }
    }
    
    return Array.from(suggestions).slice(0, 10);
  }
}

// 导出搜索类
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlogSearch;
} else {
  window.BlogSearch = BlogSearch;
}
`;
  }

  /**
   * 生成搜索页面
   * @param {string} outputDir - 输出目录
   * @param {object} buildData - 构建数据
   */
  async generateSearchPage(outputDir, buildData) {
    const searchPageContent = this.generateSearchPageHTML(buildData);
    const searchPagePath = path.join(outputDir, 'search', 'index.html');
    
    await this.utils.writeFile(searchPagePath, searchPageContent);
    
    this.utils.log(`搜索页面已生成: ${searchPagePath}`, 'info');
  }

  /**
   * 生成搜索页面HTML
   * @param {object} buildData - 构建数据
   * @returns {string} HTML内容
   */
  generateSearchPageHTML(buildData) {
    const siteConfig = buildData.config.site || {};
    
    return `<!DOCTYPE html>
<html lang="${siteConfig.language || 'zh-CN'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>搜索 - ${siteConfig.title || 'Blog'}</title>
  <meta name="description" content="搜索博客内容">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .search-box {
      margin-bottom: 30px;
    }
    .search-input {
      width: 100%;
      padding: 15px;
      font-size: 16px;
      border: 2px solid #ddd;
      border-radius: 8px;
      outline: none;
    }
    .search-input:focus {
      border-color: #007cba;
    }
    .search-results {
      margin-top: 20px;
    }
    .result-item {
      padding: 20px;
      border-bottom: 1px solid #eee;
    }
    .result-item:last-child {
      border-bottom: none;
    }
    .result-title {
      margin: 0 0 10px 0;
    }
    .result-title a {
      color: #007cba;
      text-decoration: none;
    }
    .result-title a:hover {
      text-decoration: underline;
    }
    .result-meta {
      color: #666;
      font-size: 14px;
      margin-bottom: 10px;
    }
    .result-excerpt {
      color: #333;
      line-height: 1.5;
    }
    .no-results {
      text-align: center;
      color: #666;
      padding: 40px;
    }
    .loading {
      text-align: center;
      color: #666;
      padding: 20px;
    }
    .suggestions {
      margin-top: 10px;
    }
    .suggestion {
      display: inline-block;
      background: #f0f0f0;
      padding: 5px 10px;
      margin: 2px;
      border-radius: 15px;
      font-size: 14px;
      cursor: pointer;
    }
    .suggestion:hover {
      background: #e0e0e0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🔍 搜索</h1>
    
    <div class="search-box">
      <input type="text" id="searchInput" class="search-input" placeholder="输入关键词搜索..." autocomplete="off">
      <div id="suggestions" class="suggestions"></div>
    </div>
    
    <div id="searchResults" class="search-results"></div>
  </div>
  
  <script src="/api/search.js"></script>
  <script>
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    const suggestions = document.getElementById('suggestions');
    
    const blogSearch = new BlogSearch();
    let searchTimeout;
    
    // 搜索输入处理
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        if (query) {
          performSearch(query);
          showSuggestions(query);
        } else {
          clearResults();
          clearSuggestions();
        }
      }, 300);
    });
    
    // 执行搜索
    async function performSearch(query) {
      showLoading();
      
      try {
        const results = await blogSearch.search(query);
        displayResults(results, query);
      } catch (error) {
        showError('搜索失败，请稍后重试');
      }
    }
    
    // 显示搜索建议
    async function showSuggestions(query) {
      if (query.length < 2) {
        clearSuggestions();
        return;
      }
      
      try {
        const suggestionList = await blogSearch.getSuggestions(query);
        displaySuggestions(suggestionList);
      } catch (error) {
        // 忽略建议错误
      }
    }
    
    // 显示结果
    function displayResults(results, query) {
      if (results.length === 0) {
        searchResults.innerHTML = \`
          <div class="no-results">
            <p>没有找到包含 "\${query}" 的内容</p>
            <p>请尝试其他关键词</p>
          </div>
        \`;
        return;
      }
      
      const resultsHTML = results.map(result => \`
        <div class="result-item">
          <h3 class="result-title">
            <a href="\${result.url}">\${highlightText(result.title, query)}</a>
          </h3>
          <div class="result-meta">
            \${result.type} • \${formatDate(result.date)}
            \${result.categories && result.categories.length ? ' • ' + result.categories.join(', ') : ''}
          </div>
          <div class="result-excerpt">
            \${highlightText(result.excerpt, query)}
          </div>
        </div>
      \`).join('');
      
      searchResults.innerHTML = \`
        <p>找到 \${results.length} 个结果</p>
        \${resultsHTML}
      \`;
    }
    
    // 显示建议
    function displaySuggestions(suggestionList) {
      if (suggestionList.length === 0) {
        clearSuggestions();
        return;
      }
      
      const suggestionsHTML = suggestionList.map(suggestion => \`
        <span class="suggestion" onclick="selectSuggestion('\${suggestion}')">
          \${suggestion}
        </span>
      \`).join('');
      
      suggestions.innerHTML = suggestionsHTML;
    }
    
    // 选择建议
    function selectSuggestion(suggestion) {
      searchInput.value = suggestion;
      performSearch(suggestion);
      clearSuggestions();
    }
    
    // 高亮文本
    function highlightText(text, query) {
      if (!text || !query) return text;
      
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    }
    
    // 格式化日期
    function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN');
    }
    
    // 显示加载状态
    function showLoading() {
      searchResults.innerHTML = '<div class="loading">搜索中...</div>';
    }
    
    // 显示错误
    function showError(message) {
      searchResults.innerHTML = \`<div class="no-results"><p>\${message}</p></div>\`;
    }
    
    // 清除结果
    function clearResults() {
      searchResults.innerHTML = '';
    }
    
    // 清除建议
    function clearSuggestions() {
      suggestions.innerHTML = '';
    }
    
    // 处理URL参数
    const urlParams = new URLSearchParams(window.location.search);
    const initialQuery = urlParams.get('q');
    if (initialQuery) {
      searchInput.value = initialQuery;
      performSearch(initialQuery);
    }
  </script>
</body>
</html>`;
  }

  /**
   * 销毁插件
   */
  async destroy() {
    this.searchIndex = [];
    this.utils.log('搜索插件已销毁', 'info');
  }
}

module.exports = SearchPlugin;