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
import cache, { cacheMetrics } from './cache.js';
import taskEvents from './events.js';
import { eventLog } from './listeners.js';

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
    auth: 'enabled',
    caching: 'node-cache (TTL: 60s)',
    eventProcessing: 'EventEmitter (async background handlers)'
  });
});

/* ==========================================================================
   Cache Debug & Statistics Endpoints (Practical 9 Supplementary Problem)
   ========================================================================== */

// 1. Get cache hit/miss statistics and active keys
app.get('/cache/stats', (req, res) => {
  res.json({
    ...cacheMetrics.getStats(),
    ttlSeconds: 60,
    timestamp: new Date().toISOString()
  });
});

// 2. Flush in-memory cache manually for testing
app.post('/cache/flush', (req, res) => {
  cacheMetrics.reset();
  res.json({
    message: 'Cache successfully flushed and metrics reset',
    stats: cacheMetrics.getStats()
  });
});

/* ==========================================================================
   Event-Driven Architecture Debug Log (Practical 10)
   ========================================================================== */

// GET /events/log: Returns audit log of background events processed asynchronously
app.get('/events/log', (req, res) => {
  res.json({
    totalEvents: eventLog.length,
    events: eventLog,
    timestamp: new Date().toISOString()
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

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email address' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword
    });

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

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

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
   Protected Task Routes with In-Memory Caching & EventEmitter Pipeline
   ========================================================================== */

// GET /tasks: Checks cache first (TTL 60s); queries DB on cache MISS
app.get('/tasks', auth, async (req, res, next) => {
  try {
    const cacheKey = `tasks_${req.user.id}`;
    const bypassCache = req.headers['x-no-cache'] === 'true' || req.query.nocache === 'true';

    if (!bypassCache) {
      const cachedTasks = cache.get(cacheKey);
      if (cachedTasks) {
        cacheMetrics.recordHit();
        res.set('X-Cache', 'HIT');
        return res.json(cachedTasks);
      }
    }

    cacheMetrics.recordMiss();
    const tasks = await Task.find({
      $or: [{ user: req.user.id }, { user: null }, { user: { $exists: false } }]
    }).sort({ createdAt: -1 });

    cache.set(cacheKey, tasks);
    cacheMetrics.recordWrite();

    res.set('X-Cache', bypassCache ? 'BYPASS' : 'MISS');
    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// GET /tasks/:id: Cached separately from all-tasks list
app.get('/tasks/:id', auth, async (req, res, next) => {
  try {
    const cacheKey = `task_${req.user.id}_${req.params.id}`;
    const bypassCache = req.headers['x-no-cache'] === 'true' || req.query.nocache === 'true';

    if (!bypassCache) {
      const cachedTask = cache.get(cacheKey);
      if (cachedTask) {
        cacheMetrics.recordHit();
        res.set('X-Cache', 'HIT');
        return res.json(cachedTask);
      }
    }

    cacheMetrics.recordMiss();
    const task = await Task.findOne({
      _id: req.params.id,
      $or: [{ user: req.user.id }, { user: null }, { user: { $exists: false } }]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    cache.set(cacheKey, task);
    cacheMetrics.recordWrite();

    res.set('X-Cache', bypassCache ? 'BYPASS' : 'MISS');
    res.json(task);
  } catch (error) {
    next(error);
  }
});

// POST /tasks: Responds immediately (201), then emits 'task-created' event asynchronously (Practical 10)
app.post('/tasks', auth, validateTask, async (req, res, next) => {
  try {
    const task = await Task.create({
      ...req.body,
      user: req.user.id
    });

    // Invalidate cached tasks list for this user
    cache.del(`tasks_${req.user.id}`);
    cacheMetrics.recordInvalidation();

    // 1. Send API response immediately
    const apiResponseTimestamp = new Date().toISOString();
    console.log(`[API] Response sent at ${apiResponseTimestamp} (Status: 201 Created)`);
    res.status(201).json(task);

    // 2. Emit 'task-created' event handled asynchronously by background listener
    taskEvents.emit('task-created', {
      ...task.toObject(),
      userEmail: req.user.email,
      apiResponseTimestamp
    });
  } catch (error) {
    next(error);
  }
});

// PUT /tasks/:id: Updates MongoDB and invalidates cache
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

    cache.del(`tasks_${req.user.id}`);
    cache.del(`task_${req.user.id}_${req.params.id}`);
    cacheMetrics.recordInvalidation();

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// DELETE /tasks/:id: Responds immediately, then emits 'task-deleted' event asynchronously (Practical 10)
app.delete('/tasks/:id', auth, async (req, res, next) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      $or: [{ user: req.user.id }, { user: null }, { user: { $exists: false } }]
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    cache.del(`tasks_${req.user.id}`);
    cache.del(`task_${req.user.id}_${req.params.id}`);
    cacheMetrics.recordInvalidation();

    const apiResponseTimestamp = new Date().toISOString();
    console.log(`[API] Delete response sent at ${apiResponseTimestamp} (Status: 200 OK)`);
    res.json({ message: 'Task deleted successfully' });

    // Practical 10 Supplementary Requirement: Emit 'task-deleted' event
    taskEvents.emit('task-deleted', {
      id: req.params.id,
      title: task.title,
      userEmail: req.user.email,
      apiResponseTimestamp
    });
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

// Start Server (only when not running under automated test runner)
const startServer = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/taskdb';
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
  return app.listen(port, () => console.log(`Task API with EventEmitter listening on port ${port}`));
};

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((error) => {
    console.error('Unable to start server:', error.message);
    process.exitCode = 1;
  });
}

export { app, startServer };
export default app;