const blogModel = require('../models/blogModel');
const followModel = require('../models/followModel');
const likeModel = require('../models/likeModel');
const db = require('../models/database');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const getRecentPosts = () => {
  return new Promise((resolve) => {
    db.all(
      `SELECT blogs.*, users.name AS author 
       FROM blogs 
       JOIN users ON blogs.user_id = users.id 
       ORDER BY blogs.created_at DESC 
       LIMIT 3`, [], (err, rows) => {
        if (err) return resolve([]);
        resolve(rows);
      }
    );
  });
};

const getPopularPosts = () => {
  return new Promise((resolve) => {
    db.all(
      `SELECT blogs.*, users.name AS author 
       FROM blogs 
       JOIN users ON blogs.user_id = users.id 
       LEFT JOIN likes ON blogs.id = likes.blog_id AND likes.type = 'like'
       GROUP BY blogs.id
       ORDER BY COUNT(likes.id) DESC
       LIMIT 3`, [], (err, rows) => {
        if (err) return resolve([]);
        resolve(rows);
      }
    );
  });
};

const blogController = {
  showCreateForm: (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('create');
  },

  createBlogPost: (req, res) => {
    const { title, content, country, visit_date } = req.body;
    const userId = req.session.user.id;

    if (!title || !content) return res.send('Title and content are required.');

    blogModel.createBlog(userId, title, content, country, visit_date, (err) => {
      if (err) {
        console.error(err);
        return res.send('Error saving blog post.');
      }
      res.redirect('/');
    });
  },

  showAllBlogs: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    db.all(
      `SELECT blogs.*, users.name AS author
       FROM blogs
       JOIN users ON blogs.user_id = users.id
       ORDER BY blogs.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset],
      async (err, blogs) => {
        if (err) {
          console.error(err);
          return res.send('Error loading blog posts.');
        }

        const userId = req.session.user?.id;
        const countryCache = {};

        for (const blog of blogs) {
          blog.isOwnPost = userId && blog.user_id === userId;

          if (userId) {
            await new Promise(resolve => {
              blogModel.isFollowing(userId, blog.user_id, (err, isFollowing) => {
                blog.isFollowing = isFollowing;
                resolve();
              });
            });
          }

          await new Promise(resolve => {
            likeModel.countReactions(blog.id, 'like', (err, result) => {
              blog.likes = result?.count || 0;
              resolve();
            });
          });

          await new Promise(resolve => {
            likeModel.countReactions(blog.id, 'dislike', (err, result) => {
              blog.dislikes = result?.count || 0;
              resolve();
            });
          });

          if (blog.country && !countryCache[blog.country.toLowerCase()]) {
            try {
              const resp = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(blog.country)}?fullText=true`);
              const data = await resp.json();
              const country = data[0];
              countryCache[blog.country.toLowerCase()] = {
                flag: country.flag || '',
                capital: country.capital?.[0] || 'N/A',
                currency: Object.keys(country.currencies || {})[0] || 'N/A'
              };
            } catch (err) {
              console.error('Country fetch error:', err);
              countryCache[blog.country.toLowerCase()] = null;
            }
          }

          blog.countryInfo = countryCache[blog.country?.toLowerCase()] || null;
        }

        const [recentPosts, popularPosts] = await Promise.all([getRecentPosts(), getPopularPosts()]);

        const renderOptions = {
          blogs,
          query: '',
          sort: 'date',
          page,
          prevPage: page > 1 ? page - 1 : 1,
          nextPage: page + 1,
          matchedUsers: [],
          limit,
          recentPosts,
          popularPosts
        };

        if (userId) {
          followModel.getFollowerCount(userId, (err1, followerResult) => {
            followModel.getFollowingCount(userId, (err2, followingResult) => {
              return res.render('home', {
                ...renderOptions,
                followerCount: followerResult?.count || 0,
                followingCount: followingResult?.count || 0
              });
            });
          });
        } else {
          res.render('home', renderOptions);
        }
      }
    );
  },

  showEditForm: (req, res) => {
    const blogId = req.params.id;
    blogModel.getBlogById(blogId, (err, blog) => {
      if (err || !blog) return res.send('Blog not found.');
      if (blog.user_id !== req.session.user.id) return res.send('Unauthorized.');
      res.render('edit', { blog });
    });
  },

  updateBlogPost: (req, res) => {
    const blogId = req.params.id;
    const { title, content, country, visit_date } = req.body;
    blogModel.updateBlog(blogId, title, content, country, visit_date, (err) => {
      if (err) return res.send('Error updating blog.');
      res.redirect('/');
    });
  },

  deleteBlogPost: (req, res) => {
    const blogId = req.params.id;
    blogModel.getBlogById(blogId, (err, blog) => {
      if (err || !blog) return res.send('Blog not found.');
      if (blog.user_id !== req.session.user.id) return res.send('Unauthorized.');
      blogModel.deleteBlog(blogId, (err) => {
        if (err) return res.send('Error deleting blog.');
        res.redirect('/');
      });
    });
  },

  searchBlogs: async (req, res) => {
    const query = req.query.query?.trim().toLowerCase() || '';
    const sort = req.query.sort === 'likes' ? 'likes' : 'date';
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    let orderByClause = 'blogs.created_at DESC';
    if (sort === 'likes') {
      orderByClause = `(SELECT COUNT(*) FROM likes WHERE likes.blog_id = blogs.id AND likes.type = "like") DESC`;
    }

    const userSearchSQL = `SELECT id, name FROM users WHERE LOWER(name) LIKE ?`;
    const matchedUsers = await new Promise((resolve, reject) => {
      db.all(userSearchSQL, [`%${query}%`], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const blogSearchSQL = `
      SELECT blogs.*, users.name AS author
      FROM blogs
      JOIN users ON blogs.user_id = users.id
      WHERE LOWER(users.name) LIKE ? OR LOWER(blogs.country) LIKE ?
      ORDER BY ${orderByClause}
      LIMIT ? OFFSET ?
    `;
    const values = [`%${query}%`, `%${query}%`, limit, offset];

    db.all(blogSearchSQL, values, async (err, blogs) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Server Error');
      }

      const userId = req.session.user?.id;
      const countryCache = {};

      for (const blog of blogs) {
        blog.isOwnPost = userId && blog.user_id === userId;

        if (userId) {
          await new Promise(resolve => {
            blogModel.isFollowing(userId, blog.user_id, (err, isFollowing) => {
              blog.isFollowing = isFollowing;
              resolve();
            });
          });
        }

        await new Promise(resolve => {
          likeModel.countReactions(blog.id, 'like', (err, result) => {
            blog.likes = result?.count || 0;
            resolve();
          });
        });

        await new Promise(resolve => {
          likeModel.countReactions(blog.id, 'dislike', (err, result) => {
            blog.dislikes = result?.count || 0;
            resolve();
          });
        });

        if (blog.country && !countryCache[blog.country.toLowerCase()]) {
          try {
            const resp = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(blog.country)}?fullText=true`);
            const data = await resp.json();
            const country = data[0];
            countryCache[blog.country.toLowerCase()] = {
              flag: country.flag || '',
              capital: country.capital?.[0] || 'N/A',
              currency: Object.keys(country.currencies || {})[0] || 'N/A'
            };
          } catch (err) {
            console.error('Country fetch error:', err);
            countryCache[blog.country.toLowerCase()] = null;
          }
        }

        blog.countryInfo = countryCache[blog.country?.toLowerCase()] || null;
      }

      const [recentPosts, popularPosts] = await Promise.all([getRecentPosts(), getPopularPosts()]);

      const renderOptions = {
        blogs,
        query,
        sort,
        page,
        nextPage: page + 1,
        prevPage: page > 1 ? page - 1 : 1,
        matchedUsers,
        limit,
        recentPosts,
        popularPosts
      };

      if (userId) {
        followModel.getFollowerCount(userId, (err1, followerResult) => {
          followModel.getFollowingCount(userId, (err2, followingResult) => {
            return res.render('home', {
              ...renderOptions,
              followerCount: followerResult?.count || 0,
              followingCount: followingResult?.count || 0
            });
          });
        });
      } else {
        res.render('home', renderOptions);
      }
    });
  }
};

module.exports = blogController;
