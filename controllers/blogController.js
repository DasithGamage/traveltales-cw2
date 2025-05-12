const blogModel = require('../models/blogModel');
const followModel = require('../models/followModel');
const likeModel = require('../models/likeModel');
const db = require('../models/database');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

/**
 * Helper function to fetch recent blog posts with country information
 * Used on homepage to display recent posts section
 * 
 * @returns {Promise<Array>} Promise resolving to array of recent posts
 */
const getRecentPosts = () => {
  return new Promise((resolve) => {
    db.all(
      `SELECT blogs.*, users.name AS author 
       FROM blogs 
       JOIN users ON blogs.user_id = users.id 
       ORDER BY blogs.created_at DESC 
       LIMIT 3`, [], async (err, rows) => {
        if (err) return resolve([]);
        
        // Enhance posts with country information from external API
        for (const post of rows) {
          if (post.country) {
            try {
              // Fetch country details from public REST Countries API
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

/**
 * Helper function to fetch most liked blog posts with country information
 * Used on homepage to display popular posts section
 * 
 * @returns {Promise<Array>} Promise resolving to array of popular posts
 */
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
        
        // Enhance posts with country information
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

/**
 * Blog Controller
 * Handles all blog post related operations for both web and API endpoints
 * Includes functions for creating, reading, updating, and deleting blog posts
 */
const blogController = {
  /**
   * Show blog creation form to logged-in users
   * Redirects to login if not authenticated
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  showCreateForm: (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    res.render('create');
  },

  /**
   * Process blog creation form submission
   * Validates required fields and creates new blog post
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createBlogPost: (req, res) => {
    const { title, content, country, visit_date } = req.body;
    const userId = req.session.user.id;

    // Validate all required fields
    if (!title || !content || !country || !visit_date) {
      return res.status(400).render('error', { 
        message: 'All fields (title, content, country, visit date) are required.',
        returnUrl: '/blog/create'
      });
    }

    // Create the blog post in database
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

  /**
   * Display a single blog post with detailed information
   * Enhances blog with country info, like counts, and follow status
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  showSingleBlog: (req, res) => {
    const blogId = req.params.id;
    
    // Fetch the blog post with author information
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

        // Enhance blog with country information from external API
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

        // Get like count for the blog post
        await new Promise(resolve => {
          likeModel.countReactions(blog.id, 'like', (err, result) => {
            blog.likes = result?.count || 0;
            resolve();
          });
        });

        // Get dislike count for the blog post
        await new Promise(resolve => {
          likeModel.countReactions(blog.id, 'dislike', (err, result) => {
            blog.dislikes = result?.count || 0;
            resolve();
          });
        });

        // Get user's current reaction to the blog post
        if (req.session.user) {
          await new Promise(resolve => {
            likeModel.getUserReaction(req.session.user.id, blog.id, (err, result) => {
              blog.userReaction = result ? result.type : null;
              resolve();
            });
          });
        }

        // Check if current user is following the blog author
        if (req.session.user) {
          await new Promise(resolve => {
            blogModel.isFollowing(req.session.user.id, blog.user_id, (err, isFollowing) => {
              blog.isFollowing = isFollowing;
              resolve();
            });
          });
        }

        // Render the single blog view with enhanced blog data
        res.render('single-blog', { blog });
      }
    );
  },

  /**
   * Display all blog posts with pagination
   * Home page with recent posts, popular posts and all blogs
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  showAllBlogs: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const offset = (page - 1) * limit;

    // Fetch paginated blog posts
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
        const countryCache = {}; // Cache country data to avoid duplicate API calls

        // Enhance each blog post with additional information
        for (const blog of blogs) {
          // Mark if the current user is the post author
          blog.isOwnPost = userId && blog.user_id === userId;

          // Check if current user is following the blog author
          if (userId) {
            await new Promise(resolve => {
              blogModel.isFollowing(userId, blog.user_id, (err, isFollowing) => {
                blog.isFollowing = isFollowing;
                resolve();
              });
            });
          }

          // Get like count for the blog post
          await new Promise(resolve => {
            likeModel.countReactions(blog.id, 'like', (err, result) => {
              blog.likes = result?.count || 0;
              resolve();
            });
          });

          // Get dislike count for the blog post
          await new Promise(resolve => {
            likeModel.countReactions(blog.id, 'dislike', (err, result) => {
              blog.dislikes = result?.count || 0;
              resolve();
            });
          });

          // Get user's current reaction to the blog post
          if (userId) {
            await new Promise(resolve => {
              likeModel.getUserReaction(userId, blog.id, (err, result) => {
                blog.userReaction = result ? result.type : null;
                resolve();
              });
            });
          }

          // Add country information if not already in cache
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
                // If no country found, set null in cache to avoid repeated lookups
                countryCache[blog.country.toLowerCase()] = null;
              }
            } catch (err) {
              console.error('Country fetch error for:', blog.country);
              countryCache[blog.country.toLowerCase()] = null;
            }
          }

          // Assign country info from cache
          blog.countryInfo = countryCache[blog.country?.toLowerCase()] || null;
        }

        // Get featured post sections (recent and popular)
        const [recentPosts, popularPosts] = await Promise.all([getRecentPosts(), getPopularPosts()]);

        // Prepare render options
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

        // Add follower/following counts for logged-in users
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

  /**
   * Show blog edit form for authorized users
   * Includes validation for ownership and authentication
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  showEditForm: (req, res) => {
    const blogId = req.params.id;
    
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).render('error', { 
        message: 'Please log in to edit blog posts.',
        returnUrl: '/login'
      });
    }
    
    // Fetch the blog to edit
    blogModel.getBlogById(blogId, (err, blog) => {
      if (err || !blog) {
        return res.status(404).render('error', { 
          message: 'Blog post not found.',
          returnUrl: '/'
        });
      }
      
      // Verify that current user is the blog author
      if (blog.user_id !== req.session.user.id) {
        return res.status(403).render('error', { 
          message: 'You are not authorized to edit this blog post.',
          returnUrl: '/'
        });
      }
      
      // Show edit form with blog data
      res.render('edit', { blog });
    });
  },

  /**
   * Process blog update form submission
   * Includes authentication and authorization checks
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateBlogPost: (req, res) => {
    const blogId = req.params.id;
    const { title, content, country, visit_date } = req.body;
    
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).render('error', { 
        message: 'Please log in to update blog posts.',
        returnUrl: '/login'
      });
    }
    
    // Update the blog post
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

  /**
   * Delete a blog post (authorized users only)
   * Includes authentication and ownership validation
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteBlogPost: (req, res) => {
    const blogId = req.params.id;
    
    // Check if user is logged in
    if (!req.session.user) {
      return res.status(401).render('error', { 
        message: 'Please log in to delete blog posts.',
        returnUrl: '/login'
      });
    }
    
    // Verify blog exists and user owns it
    blogModel.getBlogById(blogId, (err, blog) => {
      if (err || !blog) {
        return res.status(404).render('error', { 
          message: 'Blog post not found.',
          returnUrl: '/'
        });
      }
      
      // Check if current user is the blog author
      if (blog.user_id !== req.session.user.id) {
        return res.status(403).render('error', { 
          message: 'You are not authorized to delete this blog post.',
          returnUrl: '/'
        });
      }
      
      // Delete the blog post
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

  /**
   * Search for blog posts by country or author
   * Supports pagination and displays search results
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
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

    // Redirect to home if no query provided
    if (!query) {
      return res.redirect('/');
    }

    // Build the SQL WHERE clause based on search type
    let whereClause;
    let values;
    
    if (searchType === 'country') {
      // Case-insensitive search for country
      whereClause = 'WHERE LOWER(blogs.country) LIKE LOWER(?)';
      values = [`%${query}%`, limit, offset];
    } else if (searchType === 'author') {
      // Case-insensitive search for author name
      whereClause = 'WHERE LOWER(users.name) LIKE LOWER(?)';
      values = [`%${query}%`, limit, offset];
    }

    // SQL query for blog search with pagination
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

    // Execute the search query
    db.all(blogSearchSQL, values, async (err, blogs) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).render('error', { 
          message: 'Error searching blog posts. Please try again.',
          returnUrl: '/'
        });
      }

      console.log('Found blogs:', blogs.length);

      // Show an appropriate message if no results found
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
      const countryCache = {}; // Cache country data to avoid duplicate API calls

      // Enhance each blog post with additional information
      for (const blog of blogs) {
        // Mark if the current user is the post author
        blog.isOwnPost = userId && blog.user_id === userId;

        // Check if current user is following the blog author
        if (userId) {
          await new Promise(resolve => {
            blogModel.isFollowing(userId, blog.user_id, (err, isFollowing) => {
              blog.isFollowing = isFollowing;
              resolve();
            });
          });
        }

        // Get like count for the blog post
        await new Promise(resolve => {
          likeModel.countReactions(blog.id, 'like', (err, result) => {
            blog.likes = result?.count || 0;
            resolve();
          });
        });

        // Get dislike count for the blog post
        await new Promise(resolve => {
          likeModel.countReactions(blog.id, 'dislike', (err, result) => {
            blog.dislikes = result?.count || 0;
            resolve();
          });
        });

        // Get user's current reaction to the blog post
        if (userId) {
          await new Promise(resolve => {
            likeModel.getUserReaction(userId, blog.id, (err, result) => {
              blog.userReaction = result ? result.type : null;
              resolve();
            });
          });
        }

        // Add country information if not already in cache
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
              // If no country found, set null in cache to avoid repeated lookups
              countryCache[blog.country.toLowerCase()] = null;
            }
          } catch (err) {
            console.error('Country fetch error for:', blog.country);
            countryCache[blog.country.toLowerCase()] = null;
          }
        }

        // Assign country info from cache
        blog.countryInfo = countryCache[blog.country?.toLowerCase()] || null;
      }

      // Render search results page with blogs and pagination
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
  },

  // ==========================================
  // API Methods - Added for API functionality
  // ==========================================

  /**
   * API: Get all blog posts
   * Returns JSON data for all blogs with author information
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllBlogsAPI: (req, res) => {
    db.all(
      `SELECT blogs.*, users.name AS author 
       FROM blogs 
       JOIN users ON blogs.user_id = users.id 
       ORDER BY blogs.created_at DESC`,
      [],
      (err, blogs) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to fetch blogs' 
          });
        }
        res.json({ 
          success: true, 
          data: blogs,
          count: blogs.length 
        });
      }
    );
  },

  /**
   * API: Get a specific blog post by ID
   * Returns JSON data for a single blog with author info
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getBlogByIdAPI: (req, res) => {
    const blogId = req.params.id;
    
    db.get(
      `SELECT blogs.*, users.name AS author 
       FROM blogs 
       JOIN users ON blogs.user_id = users.id 
       WHERE blogs.id = ?`,
      [blogId],
      (err, blog) => {
        if (err) {
          return res.status(500).json({ 
            success: false, 
            error: 'Database error' 
          });
        }
        
        if (!blog) {
          return res.status(404).json({ 
            success: false, 
            error: 'Blog not found' 
          });
        }
        
        res.json({ 
          success: true, 
          data: blog 
        });
      }
    );
  },

  /**
   * API: Create a new blog post
   * Accepts JSON data and creates a new blog entry
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createBlogAPI: (req, res) => {
    const { title, content, country, visit_date, user_id } = req.body;
    
    // Validate required fields
    if (!title || !content || !country || !visit_date || !user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'All fields are required' 
      });
    }
    
    // Create blog post
    blogModel.createBlog(user_id, title, content, country, visit_date, (err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to create blog' 
        });
      }
      
      // Return success response
      res.status(201).json({ 
        success: true, 
        message: 'Blog created successfully' 
      });
    });
  },

  /**
   * API: Update an existing blog post
   * Accepts JSON data and updates the specified blog
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateBlogAPI: (req, res) => {
    const blogId = req.params.id;
    const { title, content, country, visit_date } = req.body;
    
    // Update the blog post
    blogModel.updateBlog(blogId, title, content, country, visit_date, (err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to update blog' 
        });
      }
      
      // Return success response
      res.json({ 
        success: true, 
        message: 'Blog updated successfully' 
      });
    });
  },

  /**
   * API: Delete a blog post
   * Removes the specified blog from the database
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteBlogAPI: (req, res) => {
    const blogId = req.params.id;
    
    // Delete the blog post
    blogModel.deleteBlog(blogId, (err) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to delete blog' 
        });
      }
      
      // Return success response
      res.json({ 
        success: true, 
        message: 'Blog deleted successfully' 
      });
    });
  },

  /**
   * API: Search for blog posts
   * Similar to web search but returns JSON data with pagination
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  searchBlogsAPI: async (req, res) => {
    const query = req.query.query?.trim() || '';
    const searchType = req.query.searchType || 'country';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Validate search query
    if (!query) {
      return res.status(400).json({ 
        success: false, 
        error: 'Search query is required' 
      });
    }

    // Build query based on search type
    let whereClause;
    let values;
    
    if (searchType === 'country') {
      whereClause = 'WHERE LOWER(blogs.country) LIKE LOWER(?)';
      values = [`%${query}%`, limit, offset];
    } else if (searchType === 'author') {
      whereClause = 'WHERE LOWER(users.name) LIKE LOWER(?)';
      values = [`%${query}%`, limit, offset];
    }

    // SQL query for blog search
    const blogSearchSQL = `
      SELECT blogs.*, users.name AS author
      FROM blogs
      JOIN users ON blogs.user_id = users.id
      ${whereClause}
      ORDER BY blogs.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // Execute search
    db.all(blogSearchSQL, values, (err, blogs) => {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          error: 'Search query failed' 
        });
      }

      // Return search results
      res.json({ 
        success: true, 
        data: blogs,
        count: blogs.length,
        page,
        limit
      });
    });
  },

  /**
   * API: Get popular blog posts
   * Returns most liked blog posts with country information
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getPopularPostsAPI: async (req, res) => {
    try {
      const posts = await getPopularPosts();
      res.json({ 
        success: true, 
        data: posts 
      });
    } catch (err) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch popular posts' 
      });
    }
  },

  /**
   * API: Get recent blog posts
   * Returns most recent blog posts with country information
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getRecentPostsAPI: async (req, res) => {
    try {
      const posts = await getRecentPosts();
      res.json({ 
        success: true, 
        data: posts 
      });
    } catch (err) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch recent posts' 
      });
    }
  }
};

module.exports = blogController;