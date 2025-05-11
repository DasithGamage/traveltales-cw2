# TravelTales – Coursework 2 Project

This is a web application where users can register, log in, and share their travel stories with others.  
Includes country information, social features, and user-based blog management.

## ✅ Features Implemented So Far
🧑‍💻 User System
- User registration and login
- Session management with authentication checks
- Logout functionality
- Dynamic navigation bar based on user status

📝 Blog Management
- Create blog posts (title, content, country, visit date)
- Edit and delete posts (only by the author)
- Paginated blog listing with author info
- Search blogs by country or author

🌍 Country Enrichment
- Fetch country details via REST Countries API
- Show capital, currency, and flag for each blog's selected country

📊 Post Highlights
- 🔥 Most Liked” section showcasing top 3 liked posts
- 🆕 Recent Posts” section highlighting latest submissions

👥 Social Features
- Follow/unfollow other users
- Show follower/following counts on homepage
- Like/dislike blog posts with live counts
- View matching users when searching
- Track own vs. others’ blog ownership with follow/unfollow controls

## Setup Instructions
1. Clone the repository  
2. Run `npm install`  
3. Start the server with `node server.js`  
4. Visit `http://localhost:3000`

## Technologies
- Node.js
- Express
- SQLite
- EJS
