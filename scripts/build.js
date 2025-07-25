import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import ejs from 'ejs';
import config from '../config/config.js';
import { getAllPosts, getPostBySlug, getAllCategories, getAllTags } from '../utils/markdown.js';
import { copyDir, emptyDir, ensureDir } from '../utils/file.js';
import { generateMeta, generateJsonLd } from '../utils/helpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '..');
const VIEWS_DIR = path.join(PROJECT_ROOT, 'views');
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const UPLOADS_DIR = path.join(PROJECT_ROOT, 'content/uploads');
const OUTPUT_DIR = path.join(PROJECT_ROOT, config.build.outputDir);

// 渲染 EJS 模板
async function renderTemplate(templatePath, data, layoutPath = null) {
  try {
    let template = await fs.readFile(templatePath, 'utf-8');
    
    // 如果指定了布局，先渲染内容再嵌入布局
    if (layoutPath) {
      const contentHtml = await ejs.render(template, data, {
        filename: templatePath,
        views: [VIEWS_DIR]
      });
      
      const layoutTemplate = await fs.readFile(layoutPath, 'utf-8');
      return await ejs.render(layoutTemplate, {
        ...data,
        body: contentHtml
      }, {
        filename: layoutPath,
        views: [VIEWS_DIR]
      });
    }
    
    return await ejs.render(template, data, {
      filename: templatePath,
      views: [VIEWS_DIR]
    });
  } catch (error) {
    console.error(`渲染模板错误 ${templatePath}:`, error);
    throw error;
  }
}

// 生成首页
async function generateHomePage(posts) {
  console.log('生成首页...');
  
  const templatePath = path.join(VIEWS_DIR, 'pages/index.ejs');
  const layoutPath = path.join(VIEWS_DIR, 'layouts/main.ejs');
  const outputPath = path.join(OUTPUT_DIR, 'index.html');
  
  const data = {
    title: config.site.title,
    description: config.site.description,
    posts: posts.slice(0, config.content.postsPerPage),
    config,
    meta: generateMeta({
      title: config.site.title,
      description: config.site.description
    }),
    jsonLd: generateJsonLd('WebSite', {})
  };
  
  const html = await renderTemplate(templatePath, data, layoutPath);
  await fs.writeFile(outputPath, html, 'utf-8');
  
  console.log('✓ 首页生成完成');
}

// 生成文章列表页
async function generatePostsPage(posts) {
  console.log('生成文章列表页...');
  
  const templatePath = path.join(VIEWS_DIR, 'pages/posts.ejs');
  const layoutPath = path.join(VIEWS_DIR, 'layouts/main.ejs');
  const postsDir = path.join(OUTPUT_DIR, 'posts');
  
  await ensureDir(postsDir);
  
  // 生成分页
  const postsPerPage = config.content.postsPerPage;
  const totalPages = Math.ceil(posts.length / postsPerPage);
  
  for (let page = 1; page <= totalPages; page++) {
    const startIndex = (page - 1) * postsPerPage;
    const pagePosts = posts.slice(startIndex, startIndex + postsPerPage);
    
    const data = {
      title: `所有文章${page > 1 ? ` - 第${page}页` : ''} - ${config.site.title}`,
      posts: pagePosts,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page + 1,
        prevPage: page - 1
      },
      config,
      meta: generateMeta({
        title: `所有文章${page > 1 ? ` - 第${page}页` : ''} - ${config.site.title}`
      })
    };
    
    const html = await renderTemplate(templatePath, data, layoutPath);
    const outputPath = page === 1 
      ? path.join(postsDir, 'index.html')
      : path.join(postsDir, `page-${page}.html`);
    
    await fs.writeFile(outputPath, html, 'utf-8');
  }
  
  console.log(`✓ 文章列表页生成完成 (${totalPages} 页)`);
}

// 生成文章详情页
async function generatePostPages(posts) {
  console.log('生成文章详情页...');
  
  const templatePath = path.join(VIEWS_DIR, 'pages/post.ejs');
  const layoutPath = path.join(VIEWS_DIR, 'layouts/main.ejs');
  const postDir = path.join(OUTPUT_DIR, 'post');
  
  await ensureDir(postDir);
  
  for (const post of posts) {
    const data = {
      title: `${post.title} - ${config.site.title}`,
      description: post.description || post.excerpt,
      post,
      config,
      meta: generateMeta({
        title: post.title,
        description: post.description || post.excerpt,
        author: post.author,
        type: 'article'
      }),
      jsonLd: generateJsonLd('Article', {
        title: post.title,
        description: post.description || post.excerpt,
        author: post.author,
        date: post.date,
        updated: post.updated,
        url: `${config.site.url}/post/${post.slug}`,
        cover: post.cover
      })
    };
    
    const html = await renderTemplate(templatePath, data, layoutPath);
    const outputPath = path.join(postDir, `${post.slug}.html`);
    
    await fs.writeFile(outputPath, html, 'utf-8');
  }
  
  console.log(`✓ 文章详情页生成完成 (${posts.length} 篇)`);
}

// 生成分类页面
async function generateCategoryPages(categories, posts) {
  console.log('生成分类页面...');
  
  const templatePath = path.join(VIEWS_DIR, 'pages/category.ejs');
  const layoutPath = path.join(VIEWS_DIR, 'layouts/main.ejs');
  const categoryDir = path.join(OUTPUT_DIR, 'category');
  
  await ensureDir(categoryDir);
  
  for (const category of categories) {
    const categoryPosts = posts.filter(post => post.category === category.name);
    
    const data = {
      title: `分类: ${category.name} - ${config.site.title}`,
      category: category.name,
      posts: categoryPosts,
      config,
      meta: generateMeta({
        title: `分类: ${category.name} - ${config.site.title}`,
        description: `${category.name} 分类下的所有文章`
      })
    };
    
    const html = await renderTemplate(templatePath, data, layoutPath);
    const outputPath = path.join(categoryDir, `${category.name}.html`);
    
    await fs.writeFile(outputPath, html, 'utf-8');
  }
  
  console.log(`✓ 分类页面生成完成 (${categories.length} 个)`);
}

// 生成标签页面
async function generateTagPages(tags, posts) {
  console.log('生成标签页面...');
  
  const templatePath = path.join(VIEWS_DIR, 'pages/tag.ejs');
  const layoutPath = path.join(VIEWS_DIR, 'layouts/main.ejs');
  const tagDir = path.join(OUTPUT_DIR, 'tag');
  
  await ensureDir(tagDir);
  
  for (const tag of tags) {
    const tagPosts = posts.filter(post => post.tags && post.tags.includes(tag.name));
    
    const data = {
      title: `标签: ${tag.name} - ${config.site.title}`,
      tag: tag.name,
      posts: tagPosts,
      config,
      meta: generateMeta({
        title: `标签: ${tag.name} - ${config.site.title}`,
        description: `${tag.name} 标签下的所有文章`
      })
    };
    
    const html = await renderTemplate(templatePath, data, layoutPath);
    const outputPath = path.join(tagDir, `${tag.name}.html`);
    
    await fs.writeFile(outputPath, html, 'utf-8');
  }
  
  console.log(`✓ 标签页面生成完成 (${tags.length} 个)`);
}

// 生成关于页面
async function generateAboutPage() {
  console.log('生成关于页面...');
  
  const templatePath = path.join(VIEWS_DIR, 'pages/about.ejs');
  const layoutPath = path.join(VIEWS_DIR, 'layouts/main.ejs');
  const outputPath = path.join(OUTPUT_DIR, 'about.html');
  
  const data = {
    title: `关于我们 - ${config.site.title}`,
    description: '了解更多关于我们的信息',
    config,
    meta: generateMeta({
      title: `关于我们 - ${config.site.title}`,
      description: '了解更多关于我们的信息'
    })
  };
  
  const html = await renderTemplate(templatePath, data, layoutPath);
  await fs.writeFile(outputPath, html, 'utf-8');
  
  console.log('✓ 关于页面生成完成');
}

// 生成 RSS 订阅
async function generateRSS(posts) {
  console.log('生成 RSS 订阅...');
  
  const rssItems = posts.slice(0, 20).map(post => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.excerpt}]]></description>
      <link>${config.site.url}/post/${post.slug}</link>
      <guid>${config.site.url}/post/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <author>${post.author}</author>
    </item>`).join('');
  
  const rssContent = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title><![CDATA[${config.site.title}]]></title>
    <description><![CDATA[${config.site.description}]]></description>
    <link>${config.site.url}</link>
    <language>${config.site.language}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${rssItems}
  </channel>
</rss>`;
  
  const outputPath = path.join(OUTPUT_DIR, 'rss.xml');
  await fs.writeFile(outputPath, rssContent, 'utf-8');
  
  console.log('✓ RSS 订阅生成完成');
}

// 生成 sitemap
async function generateSitemap(posts, categories, tags) {
  console.log('生成 Sitemap...');
  
  const urls = [
    { loc: config.site.url, priority: '1.0' },
    { loc: `${config.site.url}/posts`, priority: '0.8' },
    { loc: `${config.site.url}/about`, priority: '0.6' }
  ];
  
  // 添加文章页面
  posts.forEach(post => {
    urls.push({
      loc: `${config.site.url}/post/${post.slug}`,
      lastmod: post.updated || post.date,
      priority: '0.7'
    });
  });
  
  // 添加分类页面
  categories.forEach(category => {
    urls.push({
      loc: `${config.site.url}/category/${category.name}`,
      priority: '0.5'
    });
  });
  
  // 添加标签页面
  tags.forEach(tag => {
    urls.push({
      loc: `${config.site.url}/tag/${tag.name}`,
      priority: '0.4'
    });
  });
  
  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;
  
  const outputPath = path.join(OUTPUT_DIR, 'sitemap.xml');
  await fs.writeFile(outputPath, sitemapContent, 'utf-8');
  
  console.log('✓ Sitemap 生成完成');
}

// 复制静态资源
async function copyAssets() {
  console.log('复制静态资源...');
  
  // 复制 public 目录
  if (await fs.pathExists(PUBLIC_DIR)) {
    await copyDir(PUBLIC_DIR, path.join(OUTPUT_DIR, 'assets'));
  }
  
  // 复制上传文件
  if (await fs.pathExists(UPLOADS_DIR)) {
    await copyDir(UPLOADS_DIR, path.join(OUTPUT_DIR, 'uploads'));
  }
  
  console.log('✓ 静态资源复制完成');
}

// 主要的静态生成函数
export async function generateStaticSite() {
  try {
    console.log('🚀 开始生成静态站点...');
    const startTime = Date.now();
    
    // 清空输出目录
    if (config.build.cleanBeforeBuild) {
      await emptyDir(OUTPUT_DIR);
    } else {
      await ensureDir(OUTPUT_DIR);
    }
    
    // 获取数据
    const posts = await getAllPosts();
    const categories = await getAllCategories();
    const tags = await getAllTags();
    
    console.log(`📊 数据统计: ${posts.length} 篇文章, ${categories.length} 个分类, ${tags.length} 个标签`);
    
    // 生成页面
    await generateHomePage(posts);
    await generatePostsPage(posts);
    await generatePostPages(posts);
    await generateCategoryPages(categories, posts);
    await generateTagPages(tags, posts);
    await generateAboutPage();
    
    // 生成 RSS 和 Sitemap
    await generateRSS(posts);
    await generateSitemap(posts, categories, tags);
    
    // 复制静态资源
    await copyAssets();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(`✅ 静态站点生成完成! 耗时: ${duration}s`);
    console.log(`📁 输出目录: ${OUTPUT_DIR}`);
    
  } catch (error) {
    console.error('❌ 静态站点生成失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${__filename}`) {
  generateStaticSite().catch(console.error);
}