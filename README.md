# Student Portfolio & Full-Stack Task Manager (JWT Auth & Middleware Pipeline)

A full-stack web application integrating a **React (Vite)** frontend with an **Express.js** REST API backend, **MongoDB (Mongoose)** database, **bcrypt** password hashing, and **JWT-based authentication & middleware validation pipeline**.

> **Course**: Advanced Web Development Frameworks (ITUE301)  
> **Practical 7**: Authentication and Middleware Pipeline  
> **Student**: Samarth Rojara  

---

## 🏛️ System Architecture & Middleware Pipeline

```text
POST /register ──► Server Validation ──► bcrypt Salt & Hash ──► Save User to MongoDB ──► 201 Created
POST /login    ──► Server Validation ──► bcrypt Compare ────► Sign JWT (1h expiry)  ──► 200 OK + Token

Protected Route Flow:
Client Request (Authorization: Bearer <token>)
       │
       ▼
[CORS Middleware]
       │
       ▼
[Auth Middleware] ───► Verifies JWT signature & expiration ──► req.user = decoded
       │
       ▼
[Validation Middleware] ──► Checks required fields & types before DB operations
       │
       ▼
Controller (Protected Task Routes)
       │
       ▼
MongoDB Database (localhost:27017 or Atlas Cluster)
```

---

## 📡 REST API Reference

### 1. Authentication Endpoints

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/register` | Public | Register new user, hashes password with `bcryptjs`, returns JWT |
| `POST` | `/login` | Public | Validates credentials, verifies password hash, returns JWT |
| `GET` | `/me` | Protected | Returns details of logged-in user from decoded JWT token |

### 2. Task Management Endpoints (JWT Protected)

> **Header Required**: `Authorization: Bearer <token>`

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | API and MongoDB connectivity health check |
| `GET` | `/tasks` | Protected | Retrieve authenticated user's tasks |
| `GET` | `/tasks/:id` | Protected | Retrieve single task by MongoDB ObjectId |
| `POST` | `/tasks` | Protected | Create new task (validated by `validateTask` middleware) |
| `PUT` | `/tasks/:id` | Protected | Update task status or fields |
| `DELETE` | `/tasks/:id` | Protected | Delete task permanently from MongoDB |

---

## 🔒 Security & Middleware Implementation

1. **Password Hashing with `bcryptjs`**:
   - Passwords are salted with 10 rounds and hashed before saving to MongoDB.
   - Plaintext passwords are never stored or logged.
   - User `toJSON` removes password hashes and `__v` before returning responses.
2. **Stateless JWT Tokens**:
   - Signed using `JWT_SECRET` with a 1-hour expiration window.
   - Payload contains user identity (`id`, `email`).
3. **Authentication Middleware (`middleware/auth.js`)**:
   - Inspects `Authorization: Bearer <token>` header.
   - Traps missing tokens, invalid tokens, and expired tokens with structured `401 Unauthorized` responses without crashing the server.
4. **Server-Side Input Validation (`middleware/validate.js`)**:
   - `validateRegister`: Rejects invalid email formats and passwords under 6 characters.
   - `validateLogin`: Rejects empty email or password fields.
   - `validateTask`: Rejects missing/empty titles and invalid priority values before database operations.
5. **Frontend 401 Expiry Handling & Logout**:
   - Intercepts `401 Unauthorized` responses, clears expired tokens from `localStorage`, displays a toast notification, and redirects the user to the login prompt.
   - Provides a client-side logout button to clear credentials.

---

## 🚀 Running the Project Locally

Two servers run concurrently: Express backend on port `5001` and Vite dev server on port `5173`.

### 1. Configure Environment Variables
Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Ensure `.env` contains:
```env
MONGO_URI=mongodb://127.0.0.1:27017/taskdb
PORT=5001
VITE_API_URL=http://localhost:5001
JWT_SECRET=super_secret_jwt_key_practical7_itue301_charusat
```

### 2. Start Backend API Server
```bash
npm run server
```
*Listens on `http://localhost:5001` with MongoDB connected and JWT auth enabled.*

### 3. Start Frontend Dev Server
```bash
npm run dev
```
*Available at `http://localhost:5173`. Navigate to **Tasks (JWT Auth)**.*

---

## 📝 Analysis & Key Questions (Viva / Rubric)

### 1. Why must passwords be hashed before storage instead of saved as plain text, even in a lab/demo project?
Storing passwords in plain text creates severe security vulnerabilities:
- If the database is compromised, leaked, or backed up insecurely, all user accounts are immediately exposed.
- Users frequently reuse passwords across multiple services; a plaintext breach compromises external accounts.
- Bcrypt applies a cryptographic salt to defeat rainbow table attacks and uses an adaptive work factor (iteration rounds) that makes brute-force attacks computationally infeasible.

### 2. What does the authentication middleware actually verify, and what happens if the token is missing or expired?
The authentication middleware verifies:
1. Presence of the `Authorization: Bearer <token>` header.
2. The cryptographic signature using the server's private `JWT_SECRET` to prove the token was issued by this server and was not tampered with.
3. The expiration timestamp (`exp`).

If the token is missing, malformed, or expired, `jwt.verify()` throws an error caught in a `try/catch` block. The middleware returns `401 Unauthorized` with a clear JSON error, preventing unauthorized requests from ever reaching the route handlers.

### 3. Why should input validation happen on the server even if the frontend already validates the same fields?
Frontend validation only provides user experience feedback. Anyone can bypass browser UI validation by using tools like Postman, curl, or custom scripts to send malicious or malformed payloads directly to the API. Server-side validation guarantees:
- Rejection of malformed requests before touching database resources.
- Protection against injection and schema corruption.
- Enforcement of business rules regardless of the client calling the API.

---

## 🛠️ Verification & Linting

```bash
# Production bundle
npm run build

# Run linter
npm run lint
```
