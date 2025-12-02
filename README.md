# MealPrep Pro - Backend API

**Phase 2 Deliverable**: Node.js/Express backend with PostgreSQL database and JWT authentication for a personalized meal planning application.

---

## 🎯 Project Overview

MealPrep Pro helps users plan meals by providing personalized dinner recipes based on:
- Available cooking time
- Pantry and refrigerator ingredients
- Dietary preferences
- Recipe history

This backend API provides user authentication and database management, with future integration planned for TheMealDB recipe API.

---

## ✨ Phase 2 Features Completed

- ✅ PostgreSQL database connection with connection pooling
- ✅ User registration with input validation
- ✅ Password hashing using bcrypt (10 salt rounds)
- ✅ User login with JWT token generation (7-day expiration)
- ✅ Protected routes using JWT middleware
- ✅ Comprehensive error handling
- ✅ CORS enabled for frontend integration
- ✅ Environment variable configuration

---

## 🛠️ Tech Stack

- **Runtime**: Node.js v22.x
- **Framework**: Express.js v4.x
- **Database**: PostgreSQL v14+
- **Authentication**: JWT (jsonwebtoken)
- **Password Security**: bcrypt
- **Environment Config**: dotenv
- **CORS**: cors middleware

---

## 📋 Prerequisites

Before running this project, ensure you have:

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn package manager
- Git

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/meal-planner-backend.git
cd meal-planner-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=meal_planner_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Server Configuration
PORT=5000

# JWT Secret (change to a secure random string in production)
JWT_SECRET=your_secret_jwt_key_here
```

### 4. Set Up PostgreSQL Database

1. Ensure PostgreSQL is running
2. Create the database:
```sql
   CREATE DATABASE meal_planner_db;
```
3. Run the Phase 1 schema file to create tables
4. (Optional) Run the seed file to populate sample data

### 5. Start the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

---

## 📡 API Endpoints

### Health Check

**GET** `/api/health`

Check if the API is running.

**Response (200):**
```json
{
  "status": "OK",
  "message": "MealPrep Pro API is running",
  "timestamp": "2024-12-02T...",
  "version": "1.0.0"
}
```

---

### Authentication Endpoints

#### Register New User

**POST** `/api/auth/register`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "username": "username",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "email": "user@example.com",
    "username": "username",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-12-02T..."
  }
}
```

**Validation Rules:**
- Email and password are required
- Password must be at least 6 characters
- Email must be valid format
- Email and username must be unique

---

#### Login User

**POST** `/api/auth/login`

Authenticate user and receive JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": 1,
    "email": "user@example.com",
    "username": "username",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

#### Get User Profile (Protected)

**GET** `/api/auth/profile`

Retrieve authenticated user's profile information.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200):**
```json
{
  "user": {
    "userId": 1,
    "email": "user@example.com",
    "username": "username",
    "firstName": "John",
    "lastName": "Doe",
    "createdAt": "2024-12-02T...",
    "lastLogin": "2024-12-02T..."
  }
}
```

**Error Responses:**
- `401 Unauthorized`: No token provided
- `403 Forbidden`: Invalid or expired token

---

## 🧪 Testing the API

### Using Thunder Client (VS Code Extension)

1. Install Thunder Client extension in VS Code
2. Import the included collection (if provided)
3. Set base URL to `http://localhost:5000`
4. Test endpoints in this order:
   - Health check
   - Register user
   - Login user (save the token)
   - Get profile (use token in Authorization header)

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "username": "testuser",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

**Get Profile:**
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🧪 Test Credentials

For testing purposes, you can use:
- **Email**: john.smith@email.com
- **Password**: password123

---

## 📁 Project Structure
```
meal-planner-backend/
├── src/
│   ├── config/
│   │   └── database.js          # PostgreSQL connection configuration
│   ├── controllers/
│   │   └── authController.js    # Authentication logic (register, login, profile)
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT token verification middleware
│   ├── routes/
│   │   └── authRoutes.js        # Authentication route definitions
│   └── utils/                   # Utility functions (future use)
├── database/                    # SQL schema and seed files
├── .env                         # Environment variables (NOT in git)
├── .gitignore                   # Git ignore rules
├── package.json                 # Node.js dependencies and scripts
├── server.js                    # Express server entry point
└── README.md                    # This file
```

---

## 🔒 Security Features

- **Password Hashing**: bcrypt with 10 salt rounds prevents rainbow table attacks
- **JWT Authentication**: Secure, stateless authentication with configurable expiration
- **SQL Injection Protection**: Parameterized queries using pg library
- **Input Validation**: Email format and password length requirements
- **Error Handling**: Sanitized error messages prevent information leakage
- **CORS**: Configured to allow only necessary cross-origin requests
- **Environment Variables**: Sensitive data stored securely outside codebase

---

## 🔜 Phase 3 Preview

Planned features for the next phase:
- Save recipes to user account
- Pantry ingredient management
- Recipe recommendation algorithm based on available ingredients
- Grocery list generation
- Recipe history tracking
- Frontend integration

---

## 🐛 Known Issues / Limitations

- Token refresh not yet implemented (tokens expire after 7 days)
- Password reset functionality not yet available
- Email verification not implemented
- Rate limiting not configured

---

## 📝 Development Notes

### Database Schema
This API connects to a PostgreSQL database with the following key tables:
- `users` - User accounts with authentication
- `recipes` - Recipe information (to be populated from TheMealDB)
- `ingredients` - Ingredient catalog
- `user_pantry` - User's available ingredients
- `saved_recipes` - User's saved recipes
- Additional junction and tracking tables

### Error Handling
The API returns consistent error responses:
- `400 Bad Request` - Invalid input or missing required fields
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Invalid or expired token
- `409 Conflict` - Duplicate email or username
- `500 Internal Server Error` - Server-side errors

---

## 👤 Author

**Your Name**
- GitHub: [@wrieg](https://github.com/wrieg)
- Project: MealPrep Pro Backend API
- Course: CSCI 2999
- Semester: Fall 2025

---

## 📄 License

This project is part of an academic assignment and is for educational purposes only.

---

## 🙏 Acknowledgments

- TheMealDB API for recipe data
- PostgreSQL for robust database management
- Express.js community for excellent documentation
- Phase 1 deliverable for database schema design

---

## 📞 Support

For questions or issues:
1. Check the API endpoint documentation above
2. Review error messages in server logs
3. Verify environment variables are correctly configured
4. Ensure PostgreSQL is running and accessible

---

**Phase 2 Status**: ✅ Complete and Tested
**Last Updated**: December 2, 2025