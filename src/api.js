const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.error || errorBody.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.details = errorBody.details;
    throw error;
  }
  return response.json();
};

export const getTasks = () => {
  return fetch(`${BASE_URL}/tasks`).then(handleResponse);
};

export const getTask = (id) => {
  return fetch(`${BASE_URL}/tasks/${id}`).then(handleResponse);
};

export const createTask = (task) => {
  return fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(task)
  }).then(handleResponse);
};

export const updateTask = (id, updates) => {
  return fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  }).then(handleResponse);
};

export const deleteTask = (id) => {
  return fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'DELETE'
  }).then(handleResponse);
};

export { BASE_URL };
