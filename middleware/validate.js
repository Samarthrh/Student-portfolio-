export const validateTask = (req, res, next) => {
  const { title, priority, completed } = req.body;
  const errors = {};

  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || !title.trim()) {
      errors.title = 'Title is required and must not be empty';
    }
  } else if (req.method === 'PUT') {
    if (title !== undefined && (typeof title !== 'string' || !title.trim())) {
      errors.title = 'Title must be a non-empty string';
    }
  }

  if (priority !== undefined) {
    const validPriorities = ['low', 'medium', 'high'];
    if (!validPriorities.includes(priority)) {
      errors.priority = `Priority must be one of: ${validPriorities.join(', ')}`;
    }
  }

  if (completed !== undefined && typeof completed !== 'boolean') {
    errors.completed = 'Completed must be a boolean value';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

export const validateRegister = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.email = 'Email is required';
  } else if (!emailRegex.test(email.trim())) {
    errors.email = 'Please provide a valid email address';
  }

  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required';
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters long';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email || typeof email !== 'string' || !email.trim()) {
    errors.email = 'Email is required';
  }

  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors
    });
  }

  next();
};
