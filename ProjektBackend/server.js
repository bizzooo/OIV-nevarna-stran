const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

// Set security headers for all responses
app.use((req, res, next) => {
  // Only for secure routes
  if (req.path.startsWith('/secure')) {
    // Content Security Policy to prevent XSS
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'");
    // X-XSS-Protection header
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
  next();
});

const JWT_SECRET = 'your-secret-key';

const pool = mysql.createPool({
  host: 'localhost',
  port: 3306,      
  user: 'root',
  password: 'root',
  database: 'oivdb'
});

// Initialize database with sample data if it doesn't exist
async function initializeDatabase() {
  try {
    // Create User table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS User (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL
      )
    `);
    
    // Create UserProfiles table if it doesn't exist
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS UserProfiles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT,
        fullName VARCHAR(255),
        creditCard VARCHAR(255),
        ssn VARCHAR(255),
        FOREIGN KEY (userId) REFERENCES User(id)
      )
    `);
    
    // Check if we already have users
    const [users] = await pool.execute('SELECT COUNT(*) as count FROM User');
    
    if (users[0].count === 0) {
      // Create sample users with hashed passwords
      const password1 = await bcrypt.hash('password1', 10);
      const password2 = await bcrypt.hash('password2', 10);
      const password3 = await bcrypt.hash('password3', 10);
      
      await pool.execute(
        'INSERT INTO User (email, password) VALUES (?, ?), (?, ?), (?, ?)',
        ['user1@example.com', password1, 'user2@example.com', password2, 'user3@example.com', password3]
      );
      
      // Add user profiles with sensitive data
      await pool.execute(`
        INSERT INTO UserProfiles (userId, fullName, creditCard, ssn) VALUES 
        (1, 'John Doe', '4111-1111-1111-1111', '123-45-6789'),
        (2, 'Jane Smith', '4242-4242-4242-4242', '987-65-4321'),
        (3, 'Bob Johnson', '5555-5555-5555-5555', '111-22-3333')
      `);
      
      console.log('Database initialized with sample data');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Authentication middleware for secure endpoints
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Forbidden: Invalid token' });
    }
    
    req.user = user;
    next();
  });
};

// AUTHENTICATION ENDPOINTS

app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const [result] = await pool.execute(
      'INSERT INTO User (email, password) VALUES (?, ?)',
      [email, hashedPassword]
    );
    
    // Create empty profile for the new user
    await pool.execute(
      'INSERT INTO UserProfiles (userId, fullName, creditCard, ssn) VALUES (?, ?, ?, ?)',
      [result.insertId, 'New User', '0000-0000-0000-0000', '000-00-0000']
    );
    
    res.status(201).json({ message: 'User registered successfully', userId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const [users] = await pool.execute(
      'SELECT * FROM User WHERE email = ?',
      [email]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid email' });
    }
    
    const user = users[0];
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid login' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({ 
      message: 'Login successful', 
      user: { id: user.id, email: user.email, token }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// VULNERABLE ENDPOINTS

// 1. SQL Injection vulnerability
app.post('/vulnerable/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    // VULNERABLE: Direct string concatenation in SQL query
    const [results] = await pool.execute(
      `SELECT id, email FROM User WHERE email LIKE '%${query}%'`
    );
    
    res.status(200).json({ results });
  } catch (error) {
    console.error('SQL Error:', error);
    res.status(500).json({ message: 'Error executing query', error: error.message });
  }
});

// 2. No functionality needed for XSS demo (handled client-side)

// 3. IDOR vulnerability
app.get('/vulnerable/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // VULNERABLE: No authentication check, allows access to any user's data
    const [users] = await pool.execute(
      'SELECT User.id, User.email, UserProfiles.fullName, UserProfiles.creditCard, UserProfiles.ssn FROM User JOIN UserProfiles ON User.id = UserProfiles.userId WHERE User.id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(users[0]);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// SECURE ENDPOINTS

// 1. SQL Injection prevention - using parameterized queries
app.post('/secure/search', async (req, res) => {
  try {
    const { query } = req.body;
    
    // SECURE: Using parameterized queries
    const [results] = await pool.execute(
      'SELECT id, email FROM User WHERE email LIKE ?',
      [`%${query}%`]
    );
    
    res.status(200).json({ results });
  } catch (error) {
    // Minimal error information sent to client
    res.status(500).json({ message: 'An error occurred while processing your request' });
  }
});

// 2. No server functionality needed for XSS prevention (handled client-side with DOMPurify)

// 3. IDOR prevention
app.get('/secure/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // SECURE: Only returns the authenticated user's profile
    const [users] = await pool.execute(
      'SELECT User.id, User.email, UserProfiles.fullName, UserProfiles.creditCard FROM User JOIN UserProfiles ON User.id = UserProfiles.userId WHERE User.id = ?',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const user = users[0];
    
    // Mask the sensitive information
    const lastFourDigits = user.creditCard.slice(-4);
    
    // Return only necessary information with sensitive data masked
    res.status(200).json({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      lastFourDigits
    });
  } catch (error) {
    // Generic error message to prevent information leakage
    res.status(500).json({ message: 'An error occurred' });
  }
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
  });

