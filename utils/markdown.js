import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import matter from 'gray-matter';
import moment from 'moment';
import config from '../config/config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const POSTS_DIR = path.join(__dirname, '../content/posts');
const PAGES_DIR = path.join(__dirname, '../content/pages');

// 确保目录存在
fs.ensureDirSync(POSTS_DIR);
fs.ensureDirSync(PAGES_DIR);

// 配置 marked
marked.setOptions({
  gfm: true,
  breaks: true,
  sanitize: false,
  highlight: function(code, lang) {
    // 这里可以集成代码高亮库，如 highlight.js
    return `<pre><code class="language-${lang}">${code}</code></pre>`;
  }
});

// 生成文章 slug
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // 移除特殊字符
    .replace(/[\s_-]+/g, '-') // 替换空格和下划线为连字符
    .replace(/^-+|-+$/g, ''); // 移除开头和结尾的连字符
}

// 解析 Markdown 文件
function parseMarkdownFile(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data: frontMatter, content } = matter(fileContent);
    
    // 生成摘要
    let excerpt = '';
    if (frontMatter.excerpt) {
      excerpt = frontMatter.excerpt;
    } else {
      const moreIndex = content.indexOf('<!-- more -->');
      if (moreIndex !== -1) {
        excerpt = content.substring(0, moreIndex).trim();
      } else {
        excerpt = content.substring(0, config.theme.excerpt.length).trim() + '...';
      }
    }

    // 渲染 HTML
    const html = marked(content);
    const excerptHtml = marked(excerpt);

    // 获取文件名作为 slug
    const filename = path.basename(filePath, '.md');
    const slug = frontMatter.slug || filename;

    return {
      slug,
      title: frontMatter.title || '无标题',
      date: frontMatter.date ? moment(frontMatter.date).format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
      author: frontMatter.author || config.site.author,
      category: frontMatter.category || '未分类',
      tags: frontMatter.tags || [],
      description: frontMatter.description || '',
      cover: frontMatter.cover || '',
      draft: frontMatter.draft || false,
      content,
      html,
      excerpt,
      excerptHtml,
      readingTime: Math.ceil(content.length / 500), // 估算阅读时间（分钟）
      wordCount: content.length,
      filePath
    };
  } catch (error) {
    console.error(`解析文件 ${filePath} 错误:`, error);
    return null;
  }
}

// 获取所有文章
export async function getAllPosts() {
  try {
    const files = await fs.readdir(POSTS_DIR);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    const posts = markdownFiles
      .map(file => parseMarkdownFile(path.join(POSTS_DIR, file)))
      .filter(post => post !== null)
      .filter(post => !post.draft) // 过滤草稿
      .sort((a, b) => moment(b.date).valueOf() - moment(a.date).valueOf()); // 按日期降序排列

    return posts;
  } catch (error) {
    console.error('获取文章列表错误:', error);
    return [];
  }
}

// 根据 slug 获取文章
export async function getPostBySlug(slug) {
  try {
    const filePath = path.join(POSTS_DIR, `${slug}.md`);
    
    if (await fs.pathExists(filePath)) {
      return parseMarkdownFile(filePath);
    }
    
    // 如果直接匹配不到，搜索所有文章
    const posts = await getAllPosts();
    return posts.find(post => post.slug === slug) || null;
  } catch (error) {
    console.error(`获取文章 ${slug} 错误:`, error);
    return null;
  }
}

// 根据分类获取文章
export async function getPostsByCategory(category, limit = null) {
  try {
    const posts = await getAllPosts();
    const filteredPosts = posts.filter(post => post.category === category);
    
    return limit ? filteredPosts.slice(0, limit) : filteredPosts;
  } catch (error) {
    console.error(`获取分类 ${category} 文章错误:`, error);
    return [];
  }
}

// 根据标签获取文章
export async function getPostsByTag(tag, limit = null) {
  try {
    const posts = await getAllPosts();
    const filteredPosts = posts.filter(post => post.tags && post.tags.includes(tag));
    
    return limit ? filteredPosts.slice(0, limit) : filteredPosts;
  } catch (error) {
    console.error(`获取标签 ${tag} 文章错误:`, error);
    return [];
  }
}

// 获取所有分类
export async function getAllCategories() {
  try {
    const posts = await getAllPosts();
    const categories = [...new Set(posts.map(post => post.category))]
      .filter(category => category && category !== '未分类')
      .map(category => ({
        name: category,
        count: posts.filter(post => post.category === category).length
      }))
      .sort((a, b) => b.count - a.count);

    return categories;
  } catch (error) {
    console.error('获取分类列表错误:', error);
    return [];
  }
}

// 获取所有标签
export async function getAllTags() {
  try {
    const posts = await getAllPosts();
    const tagCounts = {};
    
    posts.forEach(post => {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const tags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return tags;
  } catch (error) {
    console.error('获取标签列表错误:', error);
    return [];
  }
}

// 创建新文章
export async function createPost(postData) {
  try {
    const slug = generateSlug(postData.title);
    const filePath = path.join(POSTS_DIR, `${slug}.md`);
    
    // 检查文件是否已存在
    if (await fs.pathExists(filePath)) {
      throw new Error(`文章 "${postData.title}" 已存在`);
    }

    const frontMatter = {
      title: postData.title,
      date: moment().format('YYYY-MM-DD HH:mm:ss'),
      author: postData.author || config.site.author,
      category: postData.category || '未分类',
      tags: postData.tags || [],
      description: postData.description || '',
      cover: postData.cover || '',
      draft: postData.draft || false
    };

    const fileContent = matter.stringify(postData.content || '', frontMatter);
    await fs.writeFile(filePath, fileContent, 'utf-8');
    
    console.log(`文章创建成功: ${slug}`);
    return slug;
  } catch (error) {
    console.error('创建文章错误:', error);
    throw error;
  }
}

// 更新文章
export async function updatePost(slug, postData) {
  try {
    const filePath = path.join(POSTS_DIR, `${slug}.md`);
    
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`文章 "${slug}" 不存在`);
    }

    const existingContent = await fs.readFile(filePath, 'utf-8');
    const { data: existingFrontMatter } = matter(existingContent);

    const frontMatter = {
      ...existingFrontMatter,
      title: postData.title,
      category: postData.category || '未分类',
      tags: postData.tags || [],
      description: postData.description || '',
      cover: postData.cover || '',
      draft: postData.draft || false,
      updated: moment().format('YYYY-MM-DD HH:mm:ss')
    };

    const fileContent = matter.stringify(postData.content || '', frontMatter);
    await fs.writeFile(filePath, fileContent, 'utf-8');
    
    console.log(`文章更新成功: ${slug}`);
    return slug;
  } catch (error) {
    console.error('更新文章错误:', error);
    throw error;
  }
}

// 删除文章
export async function deletePost(slug) {
  try {
    const filePath = path.join(POSTS_DIR, `${slug}.md`);
    
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`文章 "${slug}" 不存在`);
    }

    await fs.remove(filePath);
    console.log(`文章删除成功: ${slug}`);
    return true;
  } catch (error) {
    console.error('删除文章错误:', error);
    throw error;
  }
}