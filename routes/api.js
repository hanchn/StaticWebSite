import express from 'express';
import { getAllPosts, getPostBySlug, getAllCategories, getAllTags } from '../utils/markdown.js';
import { generateStaticSite } from '../scripts/build.js';

const router = express.Router();

// 获取所有文章 API
router.get('/posts', async (req, res) => {
  try {
    const posts = await getAllPosts();
    res.json({
      success: true,
      data: posts,
      total: posts.length
    });
  } catch (error) {
    console.error('获取文章列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取文章列表失败: ' + error.message
    });
  }
});

// 获取单篇文章 API
router.get('/posts/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const post = await getPostBySlug(slug);
    
    if (!post) {
      return res.status(404).json({
        success: false,
        message: '文章不存在'
      });
    }

    res.json({
      success: true,
      data: post
    });
  } catch (error) {
    console.error('获取文章详情错误:', error);
    res.status(500).json({
      success: false,
      message: '获取文章详情失败: ' + error.message
    });
  }
});

// 获取所有分类 API
router.get('/categories', async (req, res) => {
  try {
    const categories = await getAllCategories();
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('获取分类列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败: ' + error.message
    });
  }
});

// 获取所有标签 API
router.get('/tags', async (req, res) => {
  try {
    const tags = await getAllTags();
    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('获取标签列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取标签列表失败: ' + error.message
    });
  }
});

// 生成静态站点 API
router.post('/build', async (req, res) => {
  try {
    console.log('开始生成静态站点...');
    await generateStaticSite();
    
    res.json({
      success: true,
      message: '静态站点生成成功',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('生成静态站点错误:', error);
    res.status(500).json({
      success: false,
      message: '生成静态站点失败: ' + error.message
    });
  }
});

// 搜索文章 API
router.get('/search', async (req, res) => {
  try {
    const { q, category, tag } = req.query;
    let posts = await getAllPosts();

    // 按关键词搜索
    if (q) {
      const keyword = q.toLowerCase();
      posts = posts.filter(post => 
        post.title.toLowerCase().includes(keyword) ||
        post.content.toLowerCase().includes(keyword) ||
        (post.description && post.description.toLowerCase().includes(keyword))
      );
    }

    // 按分类筛选
    if (category) {
      posts = posts.filter(post => post.category === category);
    }

    // 按标签筛选
    if (tag) {
      posts = posts.filter(post => post.tags && post.tags.includes(tag));
    }

    res.json({
      success: true,
      data: posts,
      total: posts.length,
      query: { q, category, tag }
    });
  } catch (error) {
    console.error('搜索文章错误:', error);
    res.status(500).json({
      success: false,
      message: '搜索失败: ' + error.message
    });
  }
});

// 获取站点统计信息 API
router.get('/stats', async (req, res) => {
  try {
    const posts = await getAllPosts();
    const categories = await getAllCategories();
    const tags = await getAllTags();

    const stats = {
      totalPosts: posts.length,
      publishedPosts: posts.filter(p => !p.draft).length,
      draftPosts: posts.filter(p => p.draft).length,
      totalCategories: categories.length,
      totalTags: tags.length,
      lastUpdated: posts.length > 0 ? posts[0].date : null
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('获取统计信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取统计信息失败: ' + error.message
    });
  }
});

// 健康检查 API
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API 服务正常',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;