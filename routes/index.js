import express from 'express';
import { getAllPosts, getPostBySlug, getPostsByCategory, getPostsByTag } from '../utils/markdown.js';
import config from '../config/config.js';

const router = express.Router();

// 首页
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const postsPerPage = config.content.postsPerPage;
    const allPosts = await getAllPosts();
    const totalPosts = allPosts.length;
    const totalPages = Math.ceil(totalPosts / postsPerPage);
    const startIndex = (page - 1) * postsPerPage;
    const posts = allPosts.slice(startIndex, startIndex + postsPerPage);

    res.render('pages/index', {
      title: config.site.title,
      description: config.site.description,
      posts,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page + 1,
        prevPage: page - 1
      }
    });
  } catch (error) {
    console.error('首页加载错误:', error);
    res.status(500).render('pages/error', {
      title: '加载错误',
      message: '首页加载失败，请稍后重试。'
    });
  }
});

// 文章列表页
router.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const postsPerPage = config.content.postsPerPage;
    const allPosts = await getAllPosts();
    const totalPosts = allPosts.length;
    const totalPages = Math.ceil(totalPosts / postsPerPage);
    const startIndex = (page - 1) * postsPerPage;
    const posts = allPosts.slice(startIndex, startIndex + postsPerPage);

    res.render('pages/posts', {
      title: '所有文章 - ' + config.site.title,
      posts,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page + 1,
        prevPage: page - 1
      }
    });
  } catch (error) {
    console.error('文章列表加载错误:', error);
    res.status(500).render('pages/error', {
      title: '加载错误',
      message: '文章列表加载失败，请稍后重试。'
    });
  }
});

// 文章详情页
router.get('/post/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await getPostBySlug(slug);
    
    if (!post) {
      return res.status(404).render('pages/404', {
        title: '文章未找到 - ' + config.site.title,
        message: '抱歉，您访问的文章不存在。'
      });
    }

    // 获取相关文章（同分类的其他文章）
    const relatedPosts = await getPostsByCategory(post.category, 5);
    const filteredRelatedPosts = relatedPosts.filter(p => p.slug !== slug).slice(0, 4);

    res.render('pages/post', {
      title: post.title + ' - ' + config.site.title,
      description: post.description || post.excerpt,
      post,
      relatedPosts: filteredRelatedPosts
    });
  } catch (error) {
    console.error('文章详情加载错误:', error);
    res.status(500).render('pages/error', {
      title: '加载错误',
      message: '文章加载失败，请稍后重试。'
    });
  }
});

// 分类页面
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const postsPerPage = config.content.postsPerPage;
    const allPosts = await getPostsByCategory(category);
    const totalPosts = allPosts.length;
    const totalPages = Math.ceil(totalPosts / postsPerPage);
    const startIndex = (page - 1) * postsPerPage;
    const posts = allPosts.slice(startIndex, startIndex + postsPerPage);

    res.render('pages/category', {
      title: `分类: ${category} - ` + config.site.title,
      category,
      posts,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page + 1,
        prevPage: page - 1
      }
    });
  } catch (error) {
    console.error('分类页面加载错误:', error);
    res.status(500).render('pages/error', {
      title: '加载错误',
      message: '分类页面加载失败，请稍后重试。'
    });
  }
});

// 标签页面
router.get('/tag/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const page = parseInt(req.query.page) || 1;
    const postsPerPage = config.content.postsPerPage;
    const allPosts = await getPostsByTag(tag);
    const totalPosts = allPosts.length;
    const totalPages = Math.ceil(totalPosts / postsPerPage);
    const startIndex = (page - 1) * postsPerPage;
    const posts = allPosts.slice(startIndex, startIndex + postsPerPage);

    res.render('pages/tag', {
      title: `标签: ${tag} - ` + config.site.title,
      tag,
      posts,
      pagination: {
        current: page,
        total: totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        nextPage: page + 1,
        prevPage: page - 1
      }
    });
  } catch (error) {
    console.error('标签页面加载错误:', error);
    res.status(500).render('pages/error', {
      title: '加载错误',
      message: '标签页面加载失败，请稍后重试。'
    });
  }
});

// 关于页面
router.get('/about', (req, res) => {
  res.render('pages/about', {
    title: '关于我们 - ' + config.site.title,
    description: '了解更多关于我们的信息'
  });
});

export default router;