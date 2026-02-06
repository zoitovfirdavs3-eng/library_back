# Kutubxona Library Management System API

Production-ready Node.js API for library management with authentication, books, authors, and categories management.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication
  - Email verification with OTP
  - Role-based access control (user, admin, super_admin)
  - Password hashing with bcrypt

- **Books Management**
  - CRUD operations
  - Search and pagination
  - Cover image upload
  - Author and category relationships

- **Authors Management**
  - CRUD operations
  - Photo upload
  - Search functionality

- **Categories Management**
  - CRUD operations
  - Automatic slug generation

## � API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/resend-code` - Resend verification code
- `GET /api/auth/me` - Get current user info

### Books
- `GET /api/books` - Get all books (with search & pagination)
- `GET /api/books/:id` - Get single book
- `POST /api/books` - Create book (admin only)
- `PATCH /api/books/:id` - Update book (owner only)
- `DELETE /api/books/:id` - Delete book (owner only)
- `POST /api/books/:id/cover` - Upload book cover (owner only)

### Authors
- `GET /api/authors` - Get all authors
- `GET /api/authors/:id` - Get single author
- `POST /api/authors` - Create author (admin only)
- `PATCH /api/authors/:id` - Update author (admin only)
- `DELETE /api/authors/:id` - Delete author (admin only)
- `POST /api/authors/:id/photo` - Upload author photo (admin only)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get single category
- `POST /api/categories` - Create category (admin only)
- `PATCH /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

## �️ Installation & Setup

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/zoitovfirdavs3-eng/Library_back.git
   cd Library_back
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your configuration:
   ```env
   PORT=10000
   MONGO_URI=mongodb://localhost:27017/library
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRE=7d
   NODE_ENV=development
   
   # Gmail SMTP for OTP
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-gmail-app-password
   MAIL_FROM=Your Name <your-email@gmail.com>
   
   # Super Admin
   SUPER_ADMIN_EMAIL=admin@library.com
   SUPER_ADMIN_PASSWORD=admin123456
   ```

4. **Start MongoDB** (make sure MongoDB is running on localhost:27017)

5. **Run the application**
   ```bash
   npm run dev  # For development with nodemon
   npm start    # For production
   ```

### Production Deployment (Render.com)

1. **Deploy to Render**
   - Push your code to GitHub
   - Connect your GitHub repository to Render
   - Render will automatically detect the Node.js application
   - Set environment variables in Render dashboard

2. **Environment Variables for Production**
   ```
   NODE_ENV=production
   PORT=10000
   MONGO_URI=your-mongodb-atlas-connection-string
   JWT_SECRET=your-production-jwt-secret
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-production-email@gmail.com
   SMTP_PASS=your-production-app-password
   MAIL_FROM=Your App Name <your-production-email@gmail.com>
   SUPER_ADMIN_EMAIL=your-admin-email@gmail.com
   SUPER_ADMIN_PASSWORD=your-secure-admin-password
   ```

3. **Build Settings**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: `24.x` or higher

4. **Health Check**
   - **Health Check Path**: `/health`

## 🔒 Security Features

- **Password Hashing**: All passwords are hashed using bcrypt
- **JWT Authentication**: Secure token-based authentication
- **Email Verification**: OTP-based email verification
- **Role-Based Access**: Different access levels for different user roles
- **Input Validation**: Comprehensive input validation and sanitization
- **CORS Protection**: Configurable CORS settings
- **File Upload Security**: Secure file upload with type and size restrictions

## 📝 Error Handling

The application uses a centralized error handling system:
- Consistent error response format
- Proper HTTP status codes
- Detailed error messages in development
- Secure error messages in production

## 📈 Performance Optimizations

- Database connection pooling (maxPoolSize: 10, minPoolSize: 2)
- Efficient database queries with indexing
- Pagination for large datasets
- Static file serving
- Optimized middleware order

## 🔄 API Response Format

### Success Response
```json
{
  "status": 200,
  "message": "Operation successful",
  "data": {...}
}
```

### Error Response
```json
{
  "status": 400,
  "message": "Error description"
}
```

## 🚀 Production Checklist

Before deploying to production:

- [x] Set strong JWT_SECRET
- [x] Configure production MongoDB URI
- [x] Set up production SMTP credentials
- [x] Configure CORS for your domain
- [x] Set up health check endpoint
- [x] Add database connection pooling
- [x] Implement proper error handling
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up SSL certificate
- [ ] Test all endpoints
- [ ] Set up rate limiting

## 📞 Support

For support and questions, please contact:
- Email: zoitovfirdavs3@gmail.com
- GitHub: https://github.com/zoitovfirdavs3-eng/Library_back/issues
