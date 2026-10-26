const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const TOKEN_KEY = 'task_jwt_token';
const USER_KEY = 'task_auth_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  try {
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

export const setUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const getAuthHeaders = () => {
  const headers = {
    'Content-Type': 'application/json'
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody.error || errorBody.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.details = errorBody.details;

    // Handle token expiry or unauthorized 401 (Practical 7 Supplementary Problem)
    if (response.status === 401) {
      clearAuth();
      window.dispatchEvent(new CustomEvent('auth:expired', { detail: { message } }));
    }

    throw error;
  }
  return response.json();
};

/* Authentication API Calls */

export const register = async (email, password) => {
  const data = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(handleResponse);

  if (data.token) {
    setToken(data.token);
    setUser(data.user);
  }
  return data;
};

export const login = async (email, password) => {
  const data = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  }).then(handleResponse);

  if (data.token) {
    setToken(data.token);
    setUser(data.user);
  }
  return data;
};

export const getMe = async () => {
  return fetch(`${BASE_URL}/me`, {
    headers: getAuthHeaders()
  }).then(handleResponse);
};

export const logout = () => {
  clearAuth();
  window.dispatchEvent(new CustomEvent('auth:logout'));
};

/* Protected Task CRUD API Calls */

export const getTasks = () => {
  return fetch(`${BASE_URL}/tasks`, {
    headers: getAuthHeaders()
  }).then(handleResponse);
};

export const getTask = (id) => {
  return fetch(`${BASE_URL}/tasks/${id}`, {
    headers: getAuthHeaders()
  }).then(handleResponse);
};

export const createTask = (task) => {
  return fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(task)
  }).then(handleResponse);
};

export const updateTask = (id, updates) => {
  return fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updates)
  }).then(handleResponse);
};

export const deleteTask = (id) => {
  return fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  }).then(handleResponse);
};

/* In-Memory Caching Debug Calls (Practical 9) */

export const getCacheStats = () => {
  return fetch(`${BASE_URL}/cache/stats`).then(handleResponse);
};

export const flushCache = () => {
  return fetch(`${BASE_URL}/cache/flush`, {
    method: 'POST'
  }).then(handleResponse);
};

export { BASE_URL };
