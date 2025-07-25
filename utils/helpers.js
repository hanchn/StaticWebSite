import moment from 'moment';
import config from '../config/config.js';

// 格式化日期
export function formatDate(date, format = 'YYYY-MM-DD') {
  return moment(date).format(format);
}

// 相对时间
export function timeAgo(date) {
  return moment(date).fromNow();
}

// 截取文本
export function truncate(text, length = 100, suffix = '...') {
  if (!text || text.length <= length) {
    return text;
  }
  return text.substring(0, length) + suffix;
}

// 移除 HTML 标签
export function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '');
}

// 生成摘要
export function excerpt(content, length = 200) {
  const text = stripHtml(content);
  return truncate(text, length);
}

// URL 编码
export function urlEncode(str) {
  return encodeURIComponent(str);
}

// 生成分页数据
export function paginate(currentPage, totalPages, delta = 2) {
  const range = [];
  const rangeWithDots = [];
  
  for (let i = Math.max(2, currentPage - delta); 
       i <= Math.min(totalPages - 1, currentPage + delta); 
       i++) {
    range.push(i);
  }
  
  if (currentPage - delta > 2) {
    rangeWithDots.push(1, '...');
  } else {
    rangeWithDots.push(1);
  }
  
  rangeWithDots.push(...range);
  
  if (currentPage + delta < totalPages - 1) {
    rangeWithDots.push('...', totalPages);
  } else {
    rangeWithDots.push(totalPages);
  }
  
  return rangeWithDots.filter((item, index, arr) => {
    return arr.indexOf(item) === index;
  });
}

// 生成面包屑导航
export function breadcrumb(path) {
  const segments = path.split('/').filter(segment => segment);
  const breadcrumbs = [{ name: '首页', url: '/' }];
  
  let currentPath = '';
  segments.forEach(segment => {
    currentPath += '/' + segment;
    breadcrumbs.push({
      name: segment,
      url: currentPath
    });
  });
  
  return breadcrumbs;
}

// 生成 SEO meta 标签
export function generateMeta(options = {}) {
  const meta = {
    title: options.title || config.site.title,
    description: options.description || config.site.description,
    keywords: options.keywords || config.seo.keywords.join(', '),
    author: options.author || config.site.author,
    url: options.url || config.site.url,
    image: options.image || '',
    type: options.type || 'website'
  };
  
  return meta;
}

// 生成 JSON-LD 结构化数据
export function generateJsonLd(type, data) {
  const baseData = {
    '@context': 'https://schema.org',
    '@type': type
  };
  
  switch (type) {
    case 'Article':
      return {
        ...baseData,
        headline: data.title,
        description: data.description,
        author: {
          '@type': 'Person',
          name: data.author
        },
        datePublished: data.date,
        dateModified: data.updated || data.date,
        publisher: {
          '@type': 'Organization',
          name: config.site.title
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': data.url
        },
        image: data.cover || ''
      };
      
    case 'WebSite':
      return {
        ...baseData,
        name: config.site.title,
        description: config.site.description,
        url: config.site.url,
        author: {
          '@type': 'Person',
          name: config.site.author
        }
      };
      
    default:
      return baseData;
  }
}

// 高亮搜索关键词
export function highlightKeywords(text, keywords) {
  if (!keywords || !text) return text;
  
  const keywordArray = Array.isArray(keywords) ? keywords : [keywords];
  let result = text;
  
  keywordArray.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    result = result.replace(regex, '<mark>$1</mark>');
  });
  
  return result;
}

// 生成随机颜色
export function randomColor() {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// 生成标签云数据
export function generateTagCloud(tags) {
  if (!tags || tags.length === 0) return [];
  
  const maxCount = Math.max(...tags.map(tag => tag.count));
  const minCount = Math.min(...tags.map(tag => tag.count));
  
  return tags.map(tag => {
    const weight = (tag.count - minCount) / (maxCount - minCount);
    const fontSize = 12 + (weight * 8); // 12px - 20px
    
    return {
      ...tag,
      fontSize: Math.round(fontSize),
      color: randomColor()
    };
  });
}

// 计算阅读时间
export function calculateReadingTime(content, wordsPerMinute = 200) {
  const words = stripHtml(content).split(/\s+/).length;
  const minutes = Math.ceil(words / wordsPerMinute);
  return minutes;
}

// 生成目录（TOC）
export function generateToc(content) {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const toc = [];
  let match;
  
  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    const id = title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    
    toc.push({
      level,
      title,
      id,
      children: []
    });
  }
  
  // 构建层级结构
  const buildHierarchy = (items) => {
    const result = [];
    const stack = [];
    
    items.forEach(item => {
      while (stack.length > 0 && stack[stack.length - 1].level >= item.level) {
        stack.pop();
      }
      
      if (stack.length === 0) {
        result.push(item);
      } else {
        stack[stack.length - 1].children.push(item);
      }
      
      stack.push(item);
    });
    
    return result;
  };
  
  return buildHierarchy(toc);
}

// 验证邮箱格式
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// 验证 URL 格式
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// 生成随机字符串
export function generateRandomString(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// 深度合并对象
export function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// 防抖函数
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 节流函数
export function throttle(func, limit) {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}