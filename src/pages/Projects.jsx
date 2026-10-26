import { useState, useEffect, useCallback } from 'react';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  login,
  register,
  logout,
  getUser,
  getToken,
  getMe
} from '../api';
import Loading from '../components/Loading';
import ErrorDisplay from '../components/Error';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';

function Projects() {
  // Authentication states (Practical 7)
  const [currentUser, setCurrentUser] = useState(getUser());
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authValidationDetails, setAuthValidationDetails] = useState({});

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialError, setInitialError] = useState(null);

  // Filter & Search states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Create form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('medium');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete modal state
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback state
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch tasks
  const fetchTaskList = useCallback(() => {
    if (!getToken()) return;

    setLoading(true);
    setInitialError(null);

    getTasks()
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        setInitialError(err.message || 'Failed to fetch tasks from server');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Handle Token Expiry & Logout events (Practical 7 Supplementary Problem)
  useEffect(() => {
    const handleAuthExpired = (event) => {
      setCurrentUser(null);
      setTasks([]);
      addToast(
        event.detail?.message || 'Session expired or unauthorized. Please log in again.',
        'error'
      );
    };

    const handleAuthLogout = () => {
      setCurrentUser(null);
      setTasks([]);
      addToast('Logged out successfully', 'info');
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    window.addEventListener('auth:logout', handleAuthLogout);

    return () => {
      window.removeEventListener('auth:expired', handleAuthExpired);
      window.removeEventListener('auth:logout', handleAuthLogout);
    };
  }, [addToast]);

  // Verify session on initial load with /me endpoint
  useEffect(() => {
    if (getToken()) {
      getMe()
        .then((res) => {
          setCurrentUser(res.user);
          fetchTaskList();
        })
        .catch(() => {
          // Token is invalid/expired
          setCurrentUser(null);
        });
    }
  }, [fetchTaskList]);

  // Handle Login & Register submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setAuthValidationDetails({});
    setAuthLoading(true);

    try {
      let response;
      if (authMode === 'register') {
        response = await register(authEmail, authPassword);
        addToast('Registration successful! Welcome to Task Manager.', 'success');
      } else {
        response = await login(authEmail, authPassword);
        addToast('Login successful! Welcome back.', 'success');
      }

      setCurrentUser(response.user);
      setAuthEmail('');
      setAuthPassword('');
      fetchTaskList();
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
      if (err.details) {
        setAuthValidationDetails(err.details);
      }
      addToast(err.message || 'Authentication error', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  // Create Task with Optimistic UI update
  const handleCreateTask = async (e) => {
    e.preventDefault();
    const trimmedTitle = newTitle.trim();
    if (!trimmedTitle) {
      setCreateError('Task title is required');
      return;
    }

    setCreateError(null);
    setIsCreating(true);

    const taskPayload = {
      title: trimmedTitle,
      description: newDescription.trim(),
      priority: newPriority,
      completed: false
    };

    const tempId = `temp-${Date.now()}`;
    const optimisticTask = {
      ...taskPayload,
      _id: tempId,
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    setTasks((prev) => [optimisticTask, ...prev]);

    setNewTitle('');
    setNewDescription('');
    setNewPriority('medium');

    try {
      const savedTask = await createTask(taskPayload);
      setTasks((prev) =>
        prev.map((t) => (t._id === tempId ? savedTask : t))
      );
      addToast('Task created and saved to MongoDB!', 'success');
    } catch (err) {
      setTasks((prev) => prev.filter((t) => t._id !== tempId));
      setCreateError(err.message || 'Failed to save task to server');
      addToast(`Error creating task: ${err.message}`, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // Toggle Completion Status (PUT)
  const handleToggleComplete = async (task) => {
    const updatedStatus = !task.completed;

    setTasks((prev) =>
      prev.map((t) =>
        t._id === task._id ? { ...t, completed: updatedStatus } : t
      )
    );

    try {
      const response = await updateTask(task._id, { completed: updatedStatus });
      setTasks((prev) =>
        prev.map((t) => (t._id === task._id ? response : t))
      );
      addToast(
        updatedStatus ? 'Task marked as completed!' : 'Task marked as pending',
        'success'
      );
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) =>
          t._id === task._id ? { ...t, completed: task.completed } : t
        )
      );
      addToast(`Failed to update task: ${err.message}`, 'error');
    }
  };

  // Start Edit Mode
  const startEdit = (task) => {
    setEditingId(task._id);
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditPriority(task.priority || 'medium');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  // Save Edit (PUT)
  const handleSaveEdit = async (taskId) => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      addToast('Title cannot be empty', 'error');
      return;
    }

    setIsUpdating(true);
    const updates = {
      title: trimmedTitle,
      description: editDescription.trim(),
      priority: editPriority
    };

    try {
      const updatedTask = await updateTask(taskId, updates);
      setTasks((prev) =>
        prev.map((t) => (t._id === taskId ? updatedTask : t))
      );
      setEditingId(null);
      addToast('Task updated successfully!', 'success');
    } catch (err) {
      addToast(`Update failed: ${err.message}`, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete Task with Confirmation (DELETE)
  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    const idToDelete = taskToDelete._id;

    try {
      await deleteTask(idToDelete);
      setTasks((prev) => prev.filter((t) => t._id !== idToDelete));
      addToast('Task deleted successfully from MongoDB', 'success');
      setTaskToDelete(null);
    } catch (err) {
      addToast(`Failed to delete task: ${err.message}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'completed'
        ? t.completed
        : !t.completed;

    const matchesPriority =
      priorityFilter === 'all' ? true : t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalTasks - completedCount;

  return (
    <main className="page tasks-page">
      <Toast toasts={toasts} onDismiss={dismissToast} />

      <ConfirmModal
        isOpen={Boolean(taskToDelete)}
        title="Delete Task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This will permanently remove it from MongoDB.`}
        confirmText="Delete Task"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
        isProcessing={isDeleting}
      />

      {/* Hero Header */}
      <section className="hero-card tasks-hero">
        <div className="hero-top-row">
          <p className="eyebrow">Practical 7 • Authentication & Middleware Pipeline</p>
          {currentUser && (
            <div className="user-badge">
              <span className="user-avatar">👤</span>
              <span className="user-email">{currentUser.email}</span>
              <button
                type="button"
                className="btn btn-secondary btn-logout"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <h1>Task Management System (JWT Protected)</h1>
        <p className="lead">
          Full-stack application secured with bcrypt password hashing, JSON Web Tokens (JWT),
          authentication middleware, and server-side request validation pipelines.
        </p>

        {currentUser && (
          <div className="tasks-stats-bar">
            <div className="stat-pill">
              <span className="stat-value">{totalTasks}</span>
              <span className="stat-label">Total Tasks</span>
            </div>
            <div className="stat-pill stat-completed">
              <span className="stat-value">{completedCount}</span>
              <span className="stat-label">Completed</span>
            </div>
            <div className="stat-pill stat-pending">
              <span className="stat-value">{pendingCount}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
        )}
      </section>

      {/* When user is NOT authenticated: Display Login / Register Card */}
      {!currentUser && (
        <section className="card auth-card">
          <div className="auth-header">
            <h2>Authentication Required</h2>
            <p className="subtext">
              All task routes are protected by Express JWT middleware. Please log in or create an
              account to continue.
            </p>

            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('login');
                  setAuthError(null);
                  setAuthValidationDetails({});
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab ${authMode === 'register' ? 'active' : ''}`}
                onClick={() => {
                  setAuthMode('register');
                  setAuthError(null);
                  setAuthValidationDetails({});
                }}
              >
                Create Account (Register)
              </button>
            </div>
          </div>

          {authError && (
            <div className="form-error-banner" role="alert">
              ⚠️ {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="auth-form">
            <div className="field">
              <label htmlFor="auth-email">Email Address</label>
              <input
                id="auth-email"
                type="email"
                className="input-control"
                placeholder="name@example.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                required
                disabled={authLoading}
              />
              {authValidationDetails.email && (
                <span className="field-error-text">{authValidationDetails.email}</span>
              )}
            </div>

            <div className="field">
              <label htmlFor="auth-password">Password (minimum 6 characters)</label>
              <input
                id="auth-password"
                type="password"
                className="input-control"
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                required
                disabled={authLoading}
                minLength={6}
              />
              {authValidationDetails.password && (
                <span className="field-error-text">{authValidationDetails.password}</span>
              )}
            </div>

            <div className="auth-actions">
              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={authLoading || !authEmail || !authPassword}
              >
                {authLoading
                  ? authMode === 'login'
                    ? 'Signing in...'
                    : 'Creating Account...'
                  : authMode === 'login'
                  ? 'Sign In with JWT'
                  : 'Register & Generate JWT'}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* When user IS authenticated: Show Task Form and Task List */}
      {currentUser && (
        <>
          {/* Task Creation Form Card */}
          <section className="card task-create-card">
            <div className="card-header">
              <h2>Create New Task</h2>
              <p className="subtext">
                Protected endpoint: POST /tasks with Authorization: Bearer &lt;token&gt;
              </p>
            </div>

            {createError && (
              <div className="form-error-banner" role="alert">
                ⚠️ {createError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="task-form">
              <div className="form-row">
                <div className="field flex-2">
                  <label htmlFor="task-title">Task Title *</label>
                  <input
                    id="task-title"
                    type="text"
                    className="input-control"
                    placeholder="e.g. Implement authentication middleware"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    disabled={isCreating}
                    required
                  />
                </div>

                <div className="field flex-1">
                  <label htmlFor="task-priority">Priority</label>
                  <select
                    id="task-priority"
                    className="input-control select-control"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    disabled={isCreating}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="field">
                <label htmlFor="task-description">Description (optional)</label>
                <textarea
                  id="task-description"
                  className="input-control textarea-control"
                  placeholder="Provide additional task details or requirements..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  disabled={isCreating}
                  rows={2}
                />
              </div>

              <div className="form-actions">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreating || !newTitle.trim()}
                >
                  {isCreating ? 'Adding Task...' : '+ Add Task (Optimistic UI)'}
                </button>
              </div>
            </form>
          </section>

          {/* Main Task List & Filter Section */}
          <section className="card tasks-list-card">
            <div className="tasks-toolbar">
              <div className="toolbar-title">
                <h2>Your Tasks</h2>
                <p className="subtext">Authenticated tasks stored in MongoDB</p>
              </div>

              <div className="toolbar-filters">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search tasks..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />

                <select
                  className="filter-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending Only</option>
                  <option value="completed">Completed Only</option>
                </select>

                <select
                  className="filter-select"
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  aria-label="Filter by priority"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>

            {loading && <Loading message="Validating JWT token and retrieving tasks..." />}

            {initialError && (
              <ErrorDisplay
                message={initialError}
                onRetry={fetchTaskList}
              />
            )}

            {!loading && !initialError && (
              <div className="tasks-grid">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => {
                    const isEditing = editingId === task._id;

                    if (isEditing) {
                      return (
                        <article key={task._id} className="task-card editing-card">
                          <div className="field">
                            <label>Title</label>
                            <input
                              type="text"
                              className="input-control"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                            />
                          </div>
                          <div className="field">
                            <label>Description</label>
                            <textarea
                              className="input-control textarea-control"
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              rows={2}
                            />
                          </div>
                          <div className="field">
                            <label>Priority</label>
                            <select
                              className="input-control select-control"
                              value={editPriority}
                              onChange={(e) => setEditPriority(e.target.value)}
                            >
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                          <div className="card-actions">
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSaveEdit(task._id)}
                              disabled={isUpdating}
                            >
                              {isUpdating ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={cancelEdit}
                              disabled={isUpdating}
                            >
                              Cancel
                            </button>
                          </div>
                        </article>
                      );
                    }

                    return (
                      <article
                        key={task._id}
                        className={`task-card ${task.completed ? 'task-completed' : ''} ${
                          task.isOptimistic ? 'task-optimistic' : ''
                        }`}
                      >
                        <div className="task-card-header">
                          <button
                            type="button"
                            className={`status-toggle ${task.completed ? 'checked' : ''}`}
                            onClick={() => handleToggleComplete(task)}
                            title={task.completed ? 'Mark as pending' : 'Mark as complete'}
                            aria-label={task.completed ? 'Mark as pending' : 'Mark as complete'}
                          >
                            {task.completed ? '✓' : ''}
                          </button>

                          <div className="task-header-content">
                            <h3 className={`task-title ${task.completed ? 'strikethrough' : ''}`}>
                              {task.title}
                            </h3>
                            <span className={`priority-badge priority-${task.priority || 'medium'}`}>
                              {task.priority || 'medium'}
                            </span>
                          </div>
                        </div>

                        {task.description && (
                          <p className="task-description">{task.description}</p>
                        )}

                        <div className="task-card-footer">
                          <span className="task-date">
                            {task.createdAt
                              ? new Date(task.createdAt).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'Just now'}
                            {task.isOptimistic && ' (syncing...)'}
                          </span>

                          <div className="task-card-buttons">
                            <button
                              type="button"
                              className="btn-link edit-btn"
                              onClick={() => startEdit(task)}
                              disabled={task.isOptimistic}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn-link delete-btn"
                              onClick={() => setTaskToDelete(task)}
                              disabled={task.isOptimistic}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    {tasks.length === 0
                      ? 'No tasks for this account yet. Use the form above to add your first task!'
                      : 'No tasks match your search or filter criteria.'}
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}

export default Projects;