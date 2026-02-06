# Kutubxona API

Library Management System API for Render.com deployment

## 🚀 Render.com Deployment

### Environment Variables
Render.com dashboard'ida quyidagi environment variables'larni sozlang:

```
PORT=10000
MONGO_URI=mongodb+srv://admin:admin1@cluster0.wnyy0wg.mongodb.net/library?appName=Cluster0
JWT_SECRET=super_secret_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=production
```

### Build Settings
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Node Version**: `18.x` or higher

### Health Check
- **Health Check Path**: `/health`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Books
- `GET /api/books` - Get all books (with pagination & search)
- `GET /api/books/:id` - Get single book
- `POST /api/books` - Create new book (auth required)
- `PATCH /api/books/:id` - Update book (owner only)
- `DELETE /api/books/:id` - Delete book (owner only)
- `POST /api/books/:id/cover` - Upload book cover (owner only)

### Authors
- `GET /api/authors` - Get all authors
- `POST /api/authors` - Create author (auth required)
- `GET /api/authors/:id` - Get single author
- `PATCH /api/authors/:id` - Update author
- `DELETE /api/authors/:id` - Delete author

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (auth required)
- `GET /api/categories/:id` - Get single category
- `PATCH /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

## 🔧 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## 📝 Notes

- Server runs on port 10000 in production (Render.com requirement)
- MongoDB Atlas connection with timeout configurations
- CORS configured for both development and production
- Health check endpoint for monitoring
- File uploads for book covers and author photos
- JWT authentication with role-based access control
