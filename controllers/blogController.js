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
       LIMIT 3`, [], async (err, rows) => {
        if (err) return resolve([]);
        
        // Get country info for recent posts
        for (const post of rows) {
          if (post.country) {
            try {
              const resp = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(post.country)}?fields=name,capital,currencies,flags,flag`);
              const data = await resp.json();
              
              if (Array.isArray(data) && data.length > 0) {
                const country = data[0];
                post.countryInfo = {
                  flag: country.flag || '',
                  capital: country.capital?.[0] || 'N/A',
                  currency: Object.keys(country.currencies || {})[0] || 'N/A'
                };
              }
            } catch (err) {
              console.error('Country fetch error for recent posts:', err);
            }
          }
        }
        
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
       LIMIT 3`, [], async (err, rows) => {
        if (err) return resolve([]);
        
        // Get country info for popular posts
        for (const post of rows) {
          if (post.country) {
            try {
              const resp = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(post.country)}?fields=name,capital,currencies,flags,flag`);
              const data = await resp.json();
              
              if (Array.isArray(data) && data.length > 0) {
                const country = data[0];
                post.countryInfo = {
                  flag: country.flag || '',
                  capital: country.capital?.[0] || 'N/A',
                  currency: Object.keys(country.currencies || {})[0] || 'N/A'
                };
              }
            } catch (err) {
              console.error('Country fetch error for popular posts:', err);
            }
          }
        }
        
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

    //  All 4 fields are required
    if (!title || !content || !country || !visit_date) {
      return res.status(400).render('error', { 
        message: 'All fields (title, content, country, visit date) are required.',
        returnUrl: '/blog/create'
      });
    }

    blogModel.createBlog(userId, title, content, country, visit_date, (err) => {
      if (err) {
        console.error(err);
        return res.status(500).render('error', { 
          message: 'Error saving blog post. Please try again.',
          returnUrl: '/blog/create'
        });
      }
      res.redirect('/');
    });
  },

  showSingleBlog: (req, res) => {
    const blogId = req.params.id;
    
    db.get(
      `SELECT blogs.*, users.name AS author
       FROM blogs
       JOIN users ON blogs.user_id = users.id
       WHERE blogs.id = ?`,
      [blogId],
      async (err, blog) => {
        if (err || !blog) {
          return res.status(404).render('error', {
            message: 'Blog post not found.',
            returnUrl: '/'
          });
        }

        // Get country info
        if (blog.country) {
          try {
            const resp = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(blog.country)}?fields=name,capital,currencies,flags,flag`);
            const data = await resp.json();
            
            // Check if data is an array with at least one country
            if (Array.isArray(data) && data.length > 0) {
              const country = data[0];
              blog.countryInfo = {
                flag: country.flag || '',
                capital: country.capital?.[0] || 'N/A',
                currency: Object.keys(country.currencies || {})[0] || 'N/A'
              };
            }
          } catch (err) {
            console.error('Country fetch error for:', blog.country);
          }
        }

        // Get likes/dislikes
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

        // Check if user is following
        if (req.session.user) {
          await new Promise(resolve => {
            blogModel.isFollowing(req.session.user.id, blog.user_id, (err, isFollowing) => {
              blog.isFollowing = isFollowing;
              resolve();
            });
          });
        }

        res.render('single-blog', { blog });
      }
    );
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
          return res.status(500).render('error', { 
            message: 'Error loading blog posts. Please try again.',
            returnUrl: '/'
          });
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
              const resp = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(blog.country)}?fields=name,capital,currencies,flags,flag`);
              const data = await resp.json();
              
              // Check if data is an array with at least one country
              if (Array.isArray(data) && data.length > 0) {
                const country = data[0];
                countryCache[blog.country.toLowerCase()] = {
                  flag: country.flag || '',
                  capital: country.capital?.[0] || 'N/A',
                  currency: Object.keys(country.currencies || {})[0] || 'N/A'
                };
              } else {
                // If no country found, set null
                countryCache[blog.country.toLowerCase()] = null;
              }
            } catch (err) {
              console.error('Country fetch error for:', blog.country);
              countryCache[blog.country.toLowerCase()] = null;
            }
          }

          blog.countryInfo = countryCache[blog.country?.toLowerCase()] || null;
        }

        const [recentPosts, popularPosts] = await Promise.all([getRecentPosts(), getPopularPosts()]);

        const renderOptions = {
          blogs,
          query: '',
          searchType: '',
          page,
          prevPage: page > 1 ? page - 1 : 1,
          nextPage: page + 1,
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
    
    if (!req.session.user) {
      return res.status(401).render('error', { 
        message: 'Please log in to edit blog posts.',
        returnUrl: '/login'
      });
    }
    
    blogModel.getBlogById(blogId, (err, blog) => {
      if (err || !blog) {
        return res.status(404).render('error', { 
          message: 'Blog post not found.',
          returnUrl: '/'
        });
      }
      
      if (blog.user_id !== req.session.user.id) {
        return res.status(403).render('error', { 
          message: 'You are not authorized to edit this blog post.',
          returnUrl: '/'
        });
      }
      
      res.render('edit', { blog });
    });
  },

  updateBlogPost: (req, res) => {
    const blogId = req.params.id;
    const { title, content, country, visit_date } = req.body;
    
    if (!req.session.user) {
      return res.status(401).render('error', { 
        message: 'Please log in to update blog posts.',
        returnUrl: '/login'
      });
    }
    
    blogModel.updateBlog(blogId, title, content, country, visit_date, (err) => {
      if (err) {
        return res.status(500).render('error', { 
          message: 'Error updating blog post. Please try again.',
          returnUrl: `/blog/edit/${blogId}`
        });
      }
      res.redirect('/');
    });
  },

  deleteBlogPost: (req, res) => {
    const blogId = req.params.id;
    
    if (!req.session.user) {
      return res.status(401).render('error', { 
        message: 'Please log in to delete blog posts.',
        returnUrl: '/login'
      });
    }
    
    blogModel.getBlogById(blogId, (err, blog) => {
      if (err || !blog) {
        return res.status(404).render('error', { 
          message: 'Blog post not found.',
          returnUrl: '/'
        });
      }
      
      if (blog.user_id !== req.session.user.id) {
        return res.status(403).render('error', { 
          message: 'You are not authorized to delete this blog post.',
          returnUrl: '/'
        });
      }
      
      blogModel.deleteBlog(blogId, (err) => {
        if (err) {
          return res.status(500).render('error', { 
            message: 'Error deleting blog post. Please try again.',
            returnUrl: '/'
          });
        }
        res.redirect('/');
      });
    });
  },

  searchBlogs: async (req, res) => {
    console.log('=== SEARCH BLOGS CALLED ===');
    console.log('Query params:', req.query);
    
    const query = req.query.query?.trim() || '';
    const searchType = req.query.searchType || 'country';
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    console.log('Search query:', query);
    console.log('Search type:', searchType);

    if (!query) {
      return res.redirect('/');
    }

    // Build the WHERE clause based on search type
    let whereClause;
    let values;
    
    if (searchType === 'country') {
      // Use LIKE for partial match search for country
      whereClause = 'WHERE LOWER(blogs.country) LIKE LOWER(?)';
      values = [`%${query}%`, limit, offset];
    } else if (searchType === 'author') {
      // Use LIKE for partial match search for author
      whereClause = 'WHERE LOWER(users.name) LIKE LOWER(?)';
      values = [`%${query}%`, limit, offset];
    }

    const blogSearchSQL = `
      SELECT blogs.*, users.name AS author
      FROM blogs
      JOIN users ON blogs.user_id = users.id
      ${whereClause}
      ORDER BY blogs.created_at DESC
      LIMIT ? OFFSET ?
    `;

    console.log('SQL Query:', blogSearchSQL);
    console.log('Values:', values);

    db.all(blogSearchSQL, values, async (err, blogs) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).render('error', { 
          message: 'Error searching blog posts. Please try again.',
          returnUrl: '/'
        });
      }

      console.log('Found blogs:', blogs.length);

      // Check if no results found
      if (blogs.length === 0) {
        let errorMessage;
        if (searchType === 'country') {
          errorMessage = `No blog posts found for country "${query}". Please check the spelling or try another country.`;
        } else {
          errorMessage = `No blog posts found by author "${query}". Please check the spelling or try another author.`;
        }
        
        return res.render('error', {
          message: errorMessage,
          returnUrl: '/'
        });
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
            const resp = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(blog.country)}?fields=name,capital,currencies,flags,flag`);
            const data = await resp.json();
            
            // Check if data is an array with at least one country
            if (Array.isArray(data) && data.length > 0) {
              const country = data[0];
              countryCache[blog.country.toLowerCase()] = {
                flag: country.flag || '',
                capital: country.capital?.[0] || 'N/A',
                currency: Object.keys(country.currencies || {})[0] || 'N/A'
              };
            } else {
              // If no country found, set null
              countryCache[blog.country.toLowerCase()] = null;
            }
          } catch (err) {
            console.error('Country fetch error for:', blog.country);
            countryCache[blog.country.toLowerCase()] = null;
          }
        }

        blog.countryInfo = countryCache[blog.country?.toLowerCase()] || null;
      }

      res.render('search-results', {
        blogs,
        query,
        searchType,
        page,
        nextPage: page + 1,
        prevPage: page > 1 ? page - 1 : 1,
        limit
      });
    });
  }
};

module.exports = blogController;