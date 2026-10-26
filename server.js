import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Task from './models/Task.js';
import User from './models/User.js';
import auth from './middleware/auth.js';
import { validateTask, validateRegister, validateLogin } from './middleware/validate.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;
const jwtSecret = process.env.JWT_SECRET || 'dev_secret_key_change_in_production';

// Global Middlewares
app.use(cors());
app.use(express.json());

// Public Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    auth: 'enabled'
  });
});

/* ==========================================================================
   Authentication Routes (Practical 7)
   ========================================================================== */

// 1. User Registration (POST /register)
app.post('/register', validateRegister, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email address' });
    }

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user to MongoDB
    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword
    });

    // Sign JWT token with 1 hour expiration
    const token = jwt.sign(
      { id: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// 2. User Login (POST /login)
app.post('/login', validateLogin, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();

    // Find user in database
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Compare provided password with hashed password in database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

// 3. Current User Profile (GET /me - Supplementary Problem)
app.get('/me', auth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

/* ==========================================================================
   Protected Task Routes (JWT Middleware Pipeline)
   ========================================================================== */

// All task routes require valid JWT authentication
app.get('/tasks', auth, async (req, res, next) => {
  try {
    const tasks = await Task.find({
      $or: [{ user: req.user.id }, { user: null }, { user: { $exists: false } }]
    }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

app.get('/tasks/:id', auth, async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ user: req.user.id }, { user: null }, { user: { $exists: false } }]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

app.post('/tasks', auth, validateTask, async (req, res, next) => {
  try {
    const task = await Task.create({
      ...req.body,
      user: req.user.id
    });
    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

app.put('/tasks/:id', auth, validateTask, async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        $or: [{ user: req.user.id }, { user: null }, { user: { $exists: false } }]
      },
      req.body,
      {
        returnDocument: 'after',
        runValidators: true
      }
    );

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

app.delete('/tasks/:id', auth, async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      $or: [{ user: req.user.id }, { user: null }, { user: { $exists: false } }]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/* ==========================================================================
   Central Error Handling Middleware
   ========================================================================== */
app.use((error, req, res, _next) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation failed',
      details: Object.fromEntries(
        Object.entries(error.errors).map(([field, fieldError]) => [field, fieldError.message])
      )
    });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  console.error('Unhandled server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Server
const startServer = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskdb';
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
  app.listen(port, () => console.log(`Task API with JWT auth listening on port ${port}`));
};

startServer().catch((error) => {
  console.error('Unable to start server:', error.message);
  process.exitCode = 1;
});

export default app;