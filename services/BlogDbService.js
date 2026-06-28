// services/BlogDbService.js
import * as SQLite from 'expo-sqlite';

class BlogDbService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.initPromise = null;
  }

  async init() {
    if (this.isInitialized && this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  async _initialize() {
    try {
      console.log('🔄 Initializing Blog database...');
      
      if (this.db) {
        try {
          await this.db.closeAsync();
        } catch (e) {
          // Ignore close errors
        }
        this.db = null;
      }

      this.db = await SQLite.openDatabaseAsync('blogs.db');
      await this.createTables();
      
      this.isInitialized = true;
      console.log('✅ Blog database initialized');
      return this.db;
    } catch (error) {
      console.error('❌ Failed to initialize blog database:', error);
      this.isInitialized = false;
      this.initPromise = null;
      throw error;
    }
  }

  async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    try {
      // Blog posts table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS blogs (
          id TEXT PRIMARY KEY,
          title TEXT,
          excerpt TEXT,
          content TEXT,
          image TEXT,
          category TEXT,
          readTime INTEGER DEFAULT 5,
          date TEXT,
          authorId TEXT,
          authorName TEXT,
          authorAvatar TEXT,
          likes TEXT,
          comments TEXT,
          saved INTEGER DEFAULT 0,
          createdAt TEXT,
          updatedAt TEXT
        )
      `);

      // Comments table (for faster access)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS blog_comments (
          id TEXT PRIMARY KEY,
          blogId TEXT,
          userId TEXT,
          username TEXT,
          userAvatar TEXT,
          text TEXT,
          createdAt TEXT,
          FOREIGN KEY (blogId) REFERENCES blogs(id) ON DELETE CASCADE
        )
      `);

      // Blog likes table
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS blog_likes (
          id TEXT PRIMARY KEY,
          blogId TEXT,
          userId TEXT,
          createdAt TEXT,
          FOREIGN KEY (blogId) REFERENCES blogs(id) ON DELETE CASCADE
        )
      `);

      // Saved blogs table (for user's reading list)
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS saved_blogs (
          id TEXT PRIMARY KEY,
          blogId TEXT,
          userId TEXT,
          savedAt TEXT,
          FOREIGN KEY (blogId) REFERENCES blogs(id) ON DELETE CASCADE
        )
      `);

      // Indexes
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
        CREATE INDEX IF NOT EXISTS idx_blogs_date ON blogs(date);
        CREATE INDEX IF NOT EXISTS idx_blogs_author ON blogs(authorId);
        CREATE INDEX IF NOT EXISTS idx_comments_blog ON blog_comments(blogId);
        CREATE INDEX IF NOT EXISTS idx_likes_blog ON blog_likes(blogId);
        CREATE INDEX IF NOT EXISTS idx_saved_blog ON saved_blogs(blogId);
      `);

      console.log('✅ Blog tables created');
    } catch (error) {
      console.error('❌ Failed to create blog tables:', error);
      throw error;
    }
  }

  // ─── Blog CRUD Operations ──────────────────────────────────────────────

  async getBlogs(category = null, limit = 50, offset = 0) {
    const db = await this.ensureInit();
    if (!db) return [];

    try {
      let query = `
        SELECT * FROM blogs
        WHERE 1=1
      `;
      const params = [];

      if (category) {
        query += ` AND category = ?`;
        params.push(category);
      }

      query += ` ORDER BY date DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const result = await db.getAllAsync(query, params);

      return result.map(blog => ({
        ...blog,
        _id: blog.id,
        likes: blog.likes ? JSON.parse(blog.likes) : [],
        comments: blog.comments ? JSON.parse(blog.comments) : [],
        saved: blog.saved === 1,
      }));
    } catch (error) {
      console.warn('Failed to get blogs:', error);
      return [];
    }
  }

  async getBlog(blogId) {
    const db = await this.ensureInit();
    if (!db) return null;

    try {
      const result = await db.getFirstAsync(
        'SELECT * FROM blogs WHERE id = ?',
        [blogId]
      );

      if (result) {
        return {
          ...result,
          _id: result.id,
          likes: result.likes ? JSON.parse(result.likes) : [],
          comments: result.comments ? JSON.parse(result.comments) : [],
          saved: result.saved === 1,
        };
      }
      return null;
    } catch (error) {
      console.warn('Failed to get blog:', error);
      return null;
    }
  }

  async saveBlog(blog) {
    const db = await this.ensureInit();
    if (!db) return blog;

    try {
      const id = blog._id || blog.id;
      const likes = JSON.stringify(blog.likes || []);
      const comments = JSON.stringify(blog.comments || []);
      const saved = blog.saved ? 1 : 0;

      await db.runAsync(
        `INSERT OR REPLACE INTO blogs (
          id, title, excerpt, content, image, category, readTime, date,
          authorId, authorName, authorAvatar, likes, comments, saved, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          blog.title || '',
          blog.excerpt || '',
          blog.content ? JSON.stringify(blog.content) : '[]',
          blog.image || '',
          blog.category || 'General',
          blog.readTime || 5,
          blog.date || new Date().toISOString(),
          blog.author?._id || blog.authorId || '',
          blog.author?.username || blog.authorName || '',
          blog.author?.avatar || blog.authorAvatar || '',
          likes,
          comments,
          saved,
          blog.createdAt || new Date().toISOString(),
          blog.updatedAt || new Date().toISOString()
        ]
      );

      return blog;
    } catch (error) {
      console.warn('Failed to save blog:', error);
      return blog;
    }
  }

  async saveBlogs(blogs) {
    const db = await this.ensureInit();
    if (!db) return blogs;

    try {
      for (const blog of blogs) {
        await this.saveBlog(blog);
      }
      return blogs;
    } catch (error) {
      console.warn('Failed to save blogs:', error);
      return blogs;
    }
  }

  async deleteBlog(blogId) {
    const db = await this.ensureInit();
    if (!db) return;

    try {
      await db.runAsync('DELETE FROM blogs WHERE id = ?', [blogId]);
      await db.runAsync('DELETE FROM blog_comments WHERE blogId = ?', [blogId]);
      await db.runAsync('DELETE FROM blog_likes WHERE blogId = ?', [blogId]);
      await db.runAsync('DELETE FROM saved_blogs WHERE blogId = ?', [blogId]);
    } catch (error) {
      console.warn('Failed to delete blog:', error);
    }
  }

  // ─── Comments ────────────────────────────────────────────────────────────

  async getComments(blogId, limit = 20, offset = 0) {
    const db = await this.ensureInit();
    if (!db) return [];

    try {
      const result = await db.getAllAsync(`
        SELECT * FROM blog_comments
        WHERE blogId = ?
        ORDER BY createdAt DESC
        LIMIT ? OFFSET ?
      `, [blogId, limit, offset]);

      return result.map(comment => ({
        ...comment,
        _id: comment.id,
        user: {
          _id: comment.userId,
          username: comment.username,
          avatar: comment.userAvatar,
        }
      }));
    } catch (error) {
      console.warn('Failed to get comments:', error);
      return [];
    }
  }

  async addComment(comment) {
    const db = await this.ensureInit();
    if (!db) return comment;

    try {
      const id = comment._id || comment.id || `comment_${Date.now()}`;

      await db.runAsync(
        `INSERT OR REPLACE INTO blog_comments (
          id, blogId, userId, username, userAvatar, text, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          comment.blogId,
          comment.user?._id || comment.userId,
          comment.user?.username || comment.username || 'Anonymous',
          comment.user?.avatar || comment.userAvatar || '',
          comment.text || comment.content || '',
          comment.createdAt || comment.date || new Date().toISOString()
        ]
      );

      // Update the blog's comments array
      const blog = await this.getBlog(comment.blogId);
      if (blog) {
        const comments = blog.comments || [];
        comments.unshift({
          _id: id,
          user: {
            _id: comment.user?._id || comment.userId,
            username: comment.user?.username || comment.username || 'Anonymous',
            avatar: comment.user?.avatar || comment.userAvatar || '',
          },
          text: comment.text || comment.content || '',
          createdAt: comment.createdAt || comment.date || new Date().toISOString(),
        });
        blog.comments = comments;
        await this.saveBlog(blog);
      }

      return comment;
    } catch (error) {
      console.warn('Failed to add comment:', error);
      return comment;
    }
  }

  async deleteComment(commentId) {
    const db = await this.ensureInit();
    if (!db) return;

    try {
      await db.runAsync('DELETE FROM blog_comments WHERE id = ?', [commentId]);
    } catch (error) {
      console.warn('Failed to delete comment:', error);
    }
  }

  // ─── Likes ──────────────────────────────────────────────────────────────

  async toggleLike(blogId, userId) {
    const db = await this.ensureInit();
    if (!db) return { liked: false, likeCount: 0 };

    try {
      // Check if already liked
      const existing = await db.getFirstAsync(
        'SELECT * FROM blog_likes WHERE blogId = ? AND userId = ?',
        [blogId, userId]
      );

      if (existing) {
        // Unlike
        await db.runAsync(
          'DELETE FROM blog_likes WHERE blogId = ? AND userId = ?',
          [blogId, userId]
        );
        
        // Update blog likes array
        const blog = await this.getBlog(blogId);
        if (blog) {
          blog.likes = blog.likes.filter(id => id !== userId);
          await this.saveBlog(blog);
        }

        return { liked: false, likeCount: (blog?.likes?.length || 0) };
      } else {
        // Like
        const likeId = `like_${Date.now()}`;
        await db.runAsync(
          `INSERT INTO blog_likes (id, blogId, userId, createdAt)
           VALUES (?, ?, ?, ?)`,
          [likeId, blogId, userId, new Date().toISOString()]
        );

        // Update blog likes array
        const blog = await this.getBlog(blogId);
        if (blog) {
          blog.likes = [...(blog.likes || []), userId];
          await this.saveBlog(blog);
        }

        return { liked: true, likeCount: (blog?.likes?.length || 0) };
      }
    } catch (error) {
      console.warn('Failed to toggle like:', error);
      return { liked: false, likeCount: 0 };
    }
  }

  async getLikeCount(blogId) {
    const db = await this.ensureInit();
    if (!db) return 0;

    try {
      const result = await db.getFirstAsync(
        'SELECT COUNT(*) as count FROM blog_likes WHERE blogId = ?',
        [blogId]
      );
      return result?.count || 0;
    } catch (error) {
      console.warn('Failed to get like count:', error);
      return 0;
    }
  }

  // ─── Saved Blogs ────────────────────────────────────────────────────────

  async toggleSaved(blogId, userId) {
    const db = await this.ensureInit();
    if (!db) return { saved: false };

    try {
      const existing = await db.getFirstAsync(
        'SELECT * FROM saved_blogs WHERE blogId = ? AND userId = ?',
        [blogId, userId]
      );

      if (existing) {
        // Unsave
        await db.runAsync(
          'DELETE FROM saved_blogs WHERE blogId = ? AND userId = ?',
          [blogId, userId]
        );
        
        // Update blog saved status
        await db.runAsync(
          'UPDATE blogs SET saved = 0 WHERE id = ?',
          [blogId]
        );

        return { saved: false };
      } else {
        // Save
        const savedId = `saved_${Date.now()}`;
        await db.runAsync(
          `INSERT INTO saved_blogs (id, blogId, userId, savedAt)
           VALUES (?, ?, ?, ?)`,
          [savedId, blogId, userId, new Date().toISOString()]
        );

        // Update blog saved status
        await db.runAsync(
          'UPDATE blogs SET saved = 1 WHERE id = ?',
          [blogId]
        );

        return { saved: true };
      }
    } catch (error) {
      console.warn('Failed to toggle saved:', error);
      return { saved: false };
    }
  }

  async getSavedBlogs(userId, limit = 50, offset = 0) {
    const db = await this.ensureInit();
    if (!db) return [];

    try {
      const result = await db.getAllAsync(`
        SELECT b.* FROM blogs b
        INNER JOIN saved_blogs sb ON b.id = sb.blogId
        WHERE sb.userId = ?
        ORDER BY sb.savedAt DESC
        LIMIT ? OFFSET ?
      `, [userId, limit, offset]);

      return result.map(blog => ({
        ...blog,
        _id: blog.id,
        likes: blog.likes ? JSON.parse(blog.likes) : [],
        comments: blog.comments ? JSON.parse(blog.comments) : [],
        saved: true,
      }));
    } catch (error) {
      console.warn('Failed to get saved blogs:', error);
      return [];
    }
  }

  // ─── Categories ─────────────────────────────────────────────────────────

  async getCategories() {
    const db = await this.ensureInit();
    if (!db) return [];

    try {
      const result = await db.getAllAsync(`
        SELECT category, COUNT(*) as count
        FROM blogs
        GROUP BY category
        ORDER BY count DESC
      `);
      return result;
    } catch (error) {
      console.warn('Failed to get categories:', error);
      return [];
    }
  }

  // ─── Search ─────────────────────────────────────────────────────────────

  async searchBlogs(query, limit = 20, offset = 0) {
    const db = await this.ensureInit();
    if (!db) return [];

    try {
      const searchTerm = `%${query}%`;
      const result = await db.getAllAsync(`
        SELECT * FROM blogs
        WHERE title LIKE ? OR excerpt LIKE ? OR content LIKE ?
        ORDER BY date DESC
        LIMIT ? OFFSET ?
      `, [searchTerm, searchTerm, searchTerm, limit, offset]);

      return result.map(blog => ({
        ...blog,
        _id: blog.id,
        likes: blog.likes ? JSON.parse(blog.likes) : [],
        comments: blog.comments ? JSON.parse(blog.comments) : [],
        saved: blog.saved === 1,
      }));
    } catch (error) {
      console.warn('Failed to search blogs:', error);
      return [];
    }
  }

  // ─── Utility ─────────────────────────────────────────────────────────────

  async ensureInit() {
    try {
      await this.init();
      return this.db;
    } catch (error) {
      console.warn('⚠️ Blog database not available:', error);
      return null;
    }
  }

  async clearAll() {
    const db = await this.ensureInit();
    if (!db) return;

    try {
      await db.execAsync(`
        DELETE FROM blog_comments;
        DELETE FROM blog_likes;
        DELETE FROM saved_blogs;
        DELETE FROM blogs;
      `);
      console.log('✅ All blog data cleared');
    } catch (error) {
      console.warn('Failed to clear blog data:', error);
    }
  }

  async getStats() {
    const db = await this.ensureInit();
    if (!db) return { blogs: 0, comments: 0, likes: 0 };

    try {
      const blogs = await db.getFirstAsync('SELECT COUNT(*) as count FROM blogs');
      const comments = await db.getFirstAsync('SELECT COUNT(*) as count FROM blog_comments');
      const likes = await db.getFirstAsync('SELECT COUNT(*) as count FROM blog_likes');
      
      return {
        blogs: blogs?.count || 0,
        comments: comments?.count || 0,
        likes: likes?.count || 0,
      };
    } catch (error) {
      console.warn('Failed to get stats:', error);
      return { blogs: 0, comments: 0, likes: 0 };
    }
  }

  async getSize() {
    const db = await this.ensureInit();
    if (!db) return { blogs: 0 };

    try {
      const result = await db.getFirstAsync('SELECT COUNT(*) as count FROM blogs');
      return { blogs: result?.count || 0 };
    } catch (error) {
      console.warn('Failed to get size:', error);
      return { blogs: 0 };
    }
  }
}

export default new BlogDbService();