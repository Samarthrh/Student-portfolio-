# Student Portfolio & Full-Stack Task Management Platform

A modern full-stack web application featuring **React 19 (Vite)**, **React Router 7**, **Express.js**, **MongoDB (Mongoose)**, **bcrypt** password hashing, **JWT authentication pipeline**, **route-based code splitting**, **in-memory caching (`node-cache`)**, **asynchronous event-driven architecture**, and **complete containerization with Docker & Docker Compose**.

> **Course**: Advanced Web Development Frameworks (ITUE301)  
> **Practical 11**: Containerization with Docker and Docker Compose  
> **Student**: Samarth Rojara  

---

## 🏛️ System Architecture: Multi-Container Docker Orchestration

```text
                     docker-compose.yml
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
   ┌─────────────────┐ ┌───────────────┐ ┌────────────────┐
   │ task-frontend   │ │ task-backend  │ │ task-mongo     │
   │ (React Vite)    │ │ (Node/Express)│ │ (MongoDB 7.0)  │
   │ Port: 5173      │ │ Port: 5001    │ │ Port: 27017    │
   └────────┬────────┘ └───────┬───────┘ └───────┬────────┘
            │                  │                 │
            └───────────┬──────┴─────────────────┘
                        ▼
            [app-network (Bridge)]
      (Inter-container service name DNS)
            frontend ──► backend:5001 ──► mongodb:27017
                                                 │
                                                 ▼
                                        [Volume: mongo-data]
                                     (Persistent Database Storage)
```

---

## 🐳 Docker Services & Configuration

The application is orchestrated into 3 isolated containers communicating across a shared bridge network (`app-network`):

| Service | Container Name | Base Image / Build | Port Mapping | Storage / Notes |
| :--- | :--- | :--- | :---: | :--- |
| **`frontend`** | `task-manager-frontend` | `Dockerfile.frontend` (Multi-stage Node 18) | `5173:5173` | Built with Vite, served via `vite preview --host 0.0.0.0` |
| **`backend`** | `task-manager-backend` | `Dockerfile.backend` (Node 18 Alpine) | `5001:5001` | Express API, connects to `mongodb://mongodb:27017/taskdb` |
| **`mongodb`** | `task-manager-mongo` | `mongo:7.0` (Official Image) | `27017:27017` | Named volume `mongo-data` mounted at `/data/db` |

---

## 🚀 Running the Full Stack with a Single Command

### 1. Build and Start All Containers
From the project root, start all 3 services simultaneously:

```bash
docker compose up --build
```
*(or `docker-compose up --build` for Docker Compose v1)*

### 2. Verify Running Containers
Check that all 3 services are active and healthy:

```bash
docker ps
```

Expected output:
```text
CONTAINER ID   IMAGE                    COMMAND                  STATUS         PORTS                     NAMES
a1b2c3d4e5f6   student-portfolio-fe     "npm run preview..."    Up 2 minutes   0.0.0.0:5173->5173/tcp    task-manager-frontend
b2c3d4e5f6a1   student-portfolio-be     "node server.js"         Up 2 minutes   0.0.0.0:5001->5001/tcp    task-manager-backend
c3d4e5f6a1b2   mongo:7.0                "docker-entrypoint..."   Up 2 minutes   0.0.0.0:27017->27017/tcp  task-manager-mongo
```

### 3. Accessing the Application
* **Frontend Application**: `http://localhost:5173`
* **Backend REST API**: `http://localhost:5001`
* **Backend Health Check**: `http://localhost:5001/health`
* **MongoDB Direct Connection**: `mongodb://localhost:27017/taskdb`

### 4. Stop the Containers
```bash
docker compose down
```
*(To also wipe the database volume: `docker compose down -v`)*

---

## 🛠️ Key Implementation Details (Practical 11)

1. **Multi-Stage Frontend Dockerfile (`Dockerfile.frontend`)**:
   - **Stage 1 (`build`)**: Installs dependencies and compiles the optimized production Vite bundle into `/app/dist`.
   - **Stage 2 (`serve`)**: Copies only the built assets and minimal runtime files, significantly reducing the final image footprint.
2. **Lean Backend Dockerfile (`Dockerfile.backend`)**:
   - Uses `node:18-alpine` base image.
   - Executes `npm install --omit=dev` to exclude development dependencies in the container image.
3. **Build Context Optimization (`.dockerignore`)**:
   - Excludes heavy local `node_modules`, sensitive `.env` files, build caches, and git metadata.
   - Prevents host/container OS binary incompatibilities and speeds up build context transfer.
4. **Persistent Named Volume (`mongo-data`)**:
   - Configured in `docker-compose.yml` under `volumes: mongo-data:/data/db`.
   - Ensures all user accounts, hashed credentials, and task records persist across container restarts, stops, and rebuilds.
5. **Inter-Container Networking (`app-network`)**:
   - Configures an internal Docker bridge network where Docker's embedded DNS resolves container service names (e.g. `mongodb` resolves to the MongoDB container's internal IP).

---

## 📝 Analysis & Key Questions (Viva / Rubric)

### 1. Why does the backend container need to reference the MongoDB container by its service name (e.g., `mongodb`) rather than `localhost`?
* In Docker, each container has its own isolated network stack and private loopback interface (`localhost` / `127.0.0.1`).
* If the backend container attempts to connect to `mongodb://localhost:27017`, it searches for MongoDB inside its *own* container filesystem, where MongoDB is not running.
* When containers are joined to a user-defined Docker bridge network (`app-network`), Docker provides an automatic **embedded DNS server** that resolves container service names (like `mongodb` or `backend`) to their internal container IP addresses. Therefore, `mongodb://mongodb:27017/taskdb` correctly routes packets to the database container.

### 2. What is the difference between `EXPOSE` in a Dockerfile and the `ports` mapping in `docker-compose.yml`?
* **`EXPOSE` (Dockerfile)**:
  - Serves as internal documentation and metadata indicating which ports the containerized process listens on inside the container.
  - It does **not** publish or bind the port to the host machine's network interface; host browsers cannot access an exposed port without port publishing.
* **`ports` mapping (docker-compose.yml)**:
  - Formatted as `HOST:CONTAINER` (e.g., `"5173:5173"` or `"5001:5001"`).
  - Actively configures iptables/network routing rules on the host operating system, binding the host machine's port to the container's internal port so external traffic and host browsers can reach the container.

### 3. Why is it considered bad practice to copy `node_modules` into a Docker image instead of running `npm install` inside the container?
* **OS & CPU Architecture Incompatibility**: Native C/C++ compiled binaries (such as `fsevents`, `bcrypt`, or `esbuild`) built on a host OS (e.g., macOS ARM64 / Darwin) will crash with `Exec format error` or segmentation faults inside a Linux Alpine/Debian container.
* **Bloated Build Context**: Local `node_modules` can be hundreds of megabytes in size, drastically slowing down Docker build context uploads to the daemon.
* **Inconsistent Dependencies**: Running `npm install` inside the container ensures packages are resolved and compiled specifically for the container's target operating system, architecture, and Node.js version.

---

## 💻 Alternative: Running Locally without Docker

If Docker is not running, the application can still be run locally:

```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev
```
