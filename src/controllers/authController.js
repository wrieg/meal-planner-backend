const { pool } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ==================== REGISTER USER ====================
const register = async (req, res) => {
    console.log('📝 Register endpoint hit!');
    console.log('📦 Request body:', req.body);
  try {
    const { email, password, username, firstName, lastName } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters long' 
      });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Check if user already exists (email)
    const emailCheck = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: 'User with this email already exists' 
      });
    }

    // Check if username already exists (if provided)
    if (username) {
      const usernameCheck = await pool.query(
        'SELECT * FROM users WHERE username = $1',
        [username]
      );

      if (usernameCheck.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Username already taken' 
        });
      }
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user (matching YOUR schema)
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, username, first_name, last_name) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING user_id, email, username, first_name, last_name, created_at`,
      [email, passwordHash, username || null, firstName || null, lastName || null]
    );

    const newUser = result.rows[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newUser.user_id, 
        email: newUser.email,
        username: newUser.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // Token valid for 7 days
    );

    res.status(201).json({
      message: 'User registered successfully',
      token: token,
      user: {
        userId: newUser.user_id,
        email: newUser.email,
        username: newUser.username,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        createdAt: newUser.created_at
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Server error during registration',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== LOGIN USER ====================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    const user = result.rows[0];

    // Compare password with hashed password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Update last_login timestamp
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.user_id, 
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
        userId: user.user_id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Server error during login',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ==================== GET USER PROFILE ====================
const getProfile = async (req, res) => {
  try {
    // req.user is set by authentication middleware
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT user_id, email, username, first_name, last_name, created_at, last_login 
       FROM users WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    res.status(200).json({
      user: {
        userId: user.user_id,
        email: user.email,
        username: user.username,
        firstName: user.first_name,
        lastName: user.last_name,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error fetching profile' });
  }
};

module.exports = {
  register,
  login,
  getProfile
};