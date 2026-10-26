# Student Portfolio & Full-Stack Task Manager

A full-stack web application integrating a modern **React (Vite)** frontend with an **Express.js** REST API backend and **MongoDB (Mongoose)** database.

> **Course**: Advanced Web Development Frameworks (ITUE301)  
> **Practical 6**: Full Stack Integration React + Node + MongoDB  
> **Student**: Samarth Rojara  

---

## 🏛️ System Architecture

```text
React Frontend (localhost:5173)
       │
       │ HTTP / CORS fetch calls (via src/api.js)
       ▼
Express.js Backend (localhost:5001)
       │
       │ Mongoose ODM
       ▼
MongoDB Database (localhost:27017 or Atlas Cluster)
```

**Flow of Execution**:
1. User interacts with UI (e.g., adds, updates, or deletes a task).
2. Optimistic UI update or action status immediately reflects in React state.
3. Central `src/api.js` issues a CORS-enabled fetch request to Express (`/tasks`).
4. Express validates and executes Mongoose operations on the MongoDB database.
5. React receives the persistent document or acknowledgment, syncing server state.
6. A toast notification provides instant feedback (success/error).

---

## 🚀 Running the Project Locally

Two servers run concurrently: the Express backend on port `5001` and the React Vite dev server on port `5173`.

### 1. Prerequisites
- **Node.js**: v18+
- **npm**: v9+
- **MongoDB**: Local MongoDB instance (`mongod` on `mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string.

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
MONGO_URI=mongodb://127.0.0.1:27017/taskdb
PORT=5001
VITE_API_URL=http://localhost:5001
```

*(Note: Port 5001 is used because port 5000 is reserved on macOS by the AirPlay Receiver / ControlCenter service).*

### 3. Start the Backend API (Terminal 1)
```bash
npm run server
```
- Listens on `http://localhost:5001`
- Verifies MongoDB connection on startup.
- Health check available at: `http://localhost:5001/health`

### 4. Start the React Frontend (Terminal 2)
```bash
npm run dev
```
- Available at `http://localhost:5173`
- Navigate to the **Tasks (Full-Stack)** tab in the navigation bar.

---

## 📡 REST API Reference

The backend provides complete CRUD endpoints for task management:

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/health` | Check API and database connectivity status |
| `GET` | `/tasks` | Retrieve all tasks sorted by creation date (newest first) |
| `GET` | `/tasks/:id` | Retrieve single task by its MongoDB ObjectId |
| `POST` | `/tasks` | Create a new task in MongoDB |
| `PUT` | `/tasks/:id` | Update an existing task (title, description, priority, completed) |
| `DELETE` | `/tasks/:id` | Delete a task permanently from MongoDB |

### Task Schema & Payload Example

```json
{
  "title": "Complete Full Stack Integration",
  "description": "Connect React UI with Express and MongoDB with CRUD operations",
  "priority": "high",
  "completed": false
}
```

- `title`: String (required, auto-trimmed via schema pre-save hook)
- `description`: String (optional)
- `priority`: Enum: `['low', 'medium', 'high']` (defaults to `'medium'`)
- `completed`: Boolean (defaults to `false`)
- `createdAt`: Date (defaults to `Date.now`)

---

## ✨ Features Implemented (Practical 6)

1. **Central API Client (`src/api.js`)**:
   - Centralized Axios/fetch abstraction with `BASE_URL`.
   - Comprehensive error parsing and response status verification.
2. **CORS Configuration**:
   - Express server enabled with `cors()` middleware before route definitions, preventing cross-origin browser blocking.
3. **Full CRUD Operations in React UI**:
   - **Create**: Intuitive form to create tasks with title, description, and priority level.
   - **Read**: Live task list with counts for total, completed, and pending tasks.
   - **Update**: One-click completion status toggle and in-place edit mode for task details.
   - **Delete**: Task removal with confirmation.
4. **Optimistic UI Updates**:
   - When creating a task, it appears in the UI instantly before the server response returns, giving zero perceived latency.
   - If the server write succeeds, the temporary placeholder is replaced with the MongoDB record. If it fails, the change is automatically rolled back.
5. **Confirmation Dialog Modal**:
   - Prevents accidental deletion by prompting the user with an accessible confirmation dialog before calling `DELETE /tasks/:id`.
6. **Toast Notification System**:
   - Non-intrusive notification popups appear for create, update, and delete actions with auto-dismissal.
7. **Search & Multi-Filter Controls**:
   - Filter tasks in real time by search keywords, completion status (All / Pending / Completed), and priority level (All / High / Medium / Low).
8. **Loading & Error States**:
   - Visual loading indicators with spinners on initial load and during asynchronous operations.
   - User-friendly error banners with retry buttons on network failure.

---

## 📝 Analysis & Key Questions (Viva / Rubric)

### 1. What changes are required on the backend (CORS) to allow the React dev server to call the Express API?
Browsers enforce the **Same-Origin Policy (SOP)** for security. Since the React development server runs on `http://localhost:5173` and Express runs on `http://localhost:5001`, they have different origins (different ports). Without Cross-Origin Resource Sharing (CORS) headers, the browser blocks responses to fetch requests from reaching the frontend JavaScript.  
**Fix**: Install `cors` package and mount `app.use(cors())` before any routes in Express, which adds `Access-Control-Allow-Origin: *` to response headers.

### 2. Why should the UI re-fetch or update local state after a successful POST/PUT/DELETE rather than assuming success silently?
Assuming success silently without synchronizing with the backend introduces discrepancies between the client view and the database truth:
- MongoDB generates authoritative metadata (such as the unique `_id`, default values, timestamps `createdAt`, and validation rules).
- If the network drops or the server rejects an invalid write, silent assumption leaves ghost data on the screen that disappears upon browser refresh.
- Updating local state using the server's confirmed response (or rollback on error) guarantees data integrity.

### 3. What is the risk of not handling errors on write operations (POST/PUT/DELETE) the same way as read operations (GET)?
If read operations fail, users typically see an error banner or empty state. If a write operation (e.g. creating or deleting an item) fails silently:
- The user believes their action succeeded (e.g., that an important task was saved or sensitive data was deleted).
- Upon page refresh or navigating away, the changes vanish or deleted records reappear, leading to frustration, lost work, or corrupted workflows.
- Handling write errors ensures users receive clear notifications (e.g., toast alerts or error banners) and allows them to retry.

---

## 🛠️ Build & Linting

```bash
# Production bundle
npm run build

# Run linter
npm run lint
```
