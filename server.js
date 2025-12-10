const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware - CORS must be FIRST
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Import database config
const { testConnection } = require('./src/config/database');

const authRoutes = require('./src/routes/authRoutes');

// Import pantry routes (add with other imports)
const pantryRoutes = require('./src/routes/pantryRoutes');

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'ForDinner API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.use((req, res, next) => {
  console.log('======================');
  console.log('📨 Incoming Request:');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Body:', req.body);
  console.log('======================');
  next();
});

app.use('/api/auth', authRoutes);

// Import recipe routes at the top with other imports
const recipeRoutes = require('./src/routes/recipeRoutes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/pantry', pantryRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.url 
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 ForDinner API Server Started`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
  console.log(`💚 Health: http://localhost:5001/api/health`);
  console.log('=================================');
  
  // Test database connection after server starts
  testConnection().then(() => {
    console.log('✅ Server is ready to accept requests');
  }).catch((err) => {
    console.error('❌ Database connection failed:', err);
  });
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', error);
    process.exit(1);
  }
});

// Keep process alive
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});