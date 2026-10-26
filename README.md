# Student Portfolio & Full-Stack Task Management Platform

A high-performance full-stack web application featuring **React 19 (Vite)**, **React Router 7**, **Express.js**, **MongoDB (Mongoose)**, **bcrypt** password hashing, **JWT authentication pipeline**, **route-based code splitting**, **in-memory caching (`node-cache`)**, and **asynchronous event-driven architecture using Node.js native `EventEmitter`**.

> **Course**: Advanced Web Development Frameworks (ITUE301)  
> **Practical 10**: Asynchronous Processing with Event-Driven Architecture  
> **Student**: Samarth Rojara  

---

## 🏛️ System Architecture: Event-Driven Background Processing

```text
POST /tasks (or DELETE /tasks/:id) Request
       │
       ▼
 1. Write Task to MongoDB Database
       │
       ▼
 2. Invalidate In-Memory Cache (node-cache)
       │
       ▼
 3. res.status(201).json(task) ──► API Responds Immediately (~3.3 ms)
       │
       ▼
 4. taskEvents.emit('task-created', taskData) (Asynchronous Decoupled Event)
       │
       ▼ (Handled in background without blocking client)
 [Notification Listener (listeners.js)]
       ├── Logs task title, user, priority, and timestamps
       ├── Simulates slow email/webhook delivery (1500ms delay)
       └── Appends audit log to in-memory event stream (GET /events/log)
```

---

## ⏱️ Console Proof of Non-Blocking Asynchronous Timing

Recorded live during automated endpoint verification:

```text
[API] Response sent at:           2026-10-26T09:21:58.344Z (Status: 201 Created)
[Event Triggered] 'task-created': 2026-10-26T09:21:58.345Z
[Client Received Response]:       3.36 ms (Instant HTTP response)
   ... (Client continues browsing while background worker processes) ...
[Background Notification Done]:   2026-10-26T09:21:59.846Z (+1502 ms after response sent)
```

> **Observation**: The client receives HTTP `201 Created` in **3.36 ms**. The heavy notification work executes in the background and finishes **1.5 seconds later**, with zero delay perceived by the end user!

---

## 🛠️ Key Implementation Details (Practical 10)

1. **Dedicated EventEmitter Module (`events.js`)**:
   - Subclassed Node.js native `EventEmitter`.
   - Exported a shared singleton instance `taskEvents` with extended listener capacity (`setMaxListeners(25)`).
2. **Decoupled Background Listeners (`listeners.js`)**:
   - **`task-created`**: Emitted upon task creation. Simulates asynchronous email/Slack dispatch with a 1.5s delay.
   - **`task-deleted` (Supplementary 1)**: Emitted upon task deletion. Simulates background archival and analytics recording.
   - **`error` (Supplementary 2)**: Catches and logs errors thrown within event handlers, preventing unhandled error exceptions from crashing the server process.
3. **Decoupled Route Handlers (`server.js`)**:
   - `POST /tasks`: Saves task, invalidates cache, transmits HTTP `201 Created` immediately, and emits `task-created`.
   - `DELETE /tasks/:id`: Deletes task, invalidates cache, transmits HTTP `200 OK` immediately, and emits `task-deleted`.
4. **Event Audit Log & Debug Endpoint (`GET /events/log`)**:
   - Returns a history of all background events with their trigger time, completion time, payload details, and delivery status.
5. **Frontend Event Stream Monitor (`src/components/TaskAnalytics.jsx`)**:
   - Displays real-time background event stream cards directly inside the web UI with live event badges (`task-created`, `task-deleted`, `error`).

---

## 📝 Analysis & Key Questions (Viva / Rubric)

### 1. Why does emitting an event not block the API response, even though both run on the same Node.js process?
* Node.js operates on a single-threaded **Event Loop**.
* When `res.status(201).json(task)` is called, Express flushes the HTTP response headers and body down the network socket to the client immediately.
* Inside the listener, background side-effects (like timers, network I/O, database writes, or email dispatches) use asynchronous non-blocking APIs (e.g. `setTimeout`, `fetch`, or promises). These tasks are offloaded to Node's libuv thread pool or system kernel, freeing the main thread to complete the HTTP cycle instantly.

### 2. What would happen to API response time if the notification logic were placed directly inside the POST route instead of in an event handler?
* If the notification logic (e.g., waiting 1.5 seconds for a third-party SMTP server or webhook) were written sequentially inside the route handler before `res.json()`:
  - The client would be forced to wait **1,500ms + database query time** before receiving a response.
  - Slow external services or network timeouts would directly delay the user's interface.
  - Server throughput would drop dramatically as concurrent requests queue up waiting for slow external I/O.
* Using an event-driven architecture keeps API response times at **~3ms**.

### 3. Why is EventEmitter a reasonable choice for this scale of application, but not for a production system handling millions of events per day?
* **Why EventEmitter Works Well Here**:
  - Built directly into the Node.js standard library with zero external dependencies.
  - Ultra-fast in-memory dispatch with negligible CPU overhead for single-instance applications.
* **Why It Fails at High Production Scale**:
  - **No Persistence**: Events exist solely in process RAM. If the Node.js process crashes, restarts, or restarts on deployment, all in-flight events are permanently lost.
  - **No Retries or Backoff**: If an email provider fails, `EventEmitter` cannot automatically retry with exponential backoff or dead-letter queues.
  - **No Multi-Server Distribution**: In a clustered environment with multiple instances behind a load balancer, events cannot be shared across servers.
  - **Memory Pressure**: Unbounded events under heavy spikes can exhaust Node's heap memory.
  - *Production Solution*: At enterprise scale, dedicated message brokers like **RabbitMQ**, **Apache Kafka**, or Redis-backed queues (**BullMQ**) provide persistence, distributed consumption, rate limiting, and guaranteed delivery.

---

## 🚀 Running the Project Locally

### 1. Start Express Backend API
```bash
npm run server
```
*Listens on `http://localhost:5001` with MongoDB connected, caching active, and EventEmitter listening.*

### 2. Start Frontend Dev Server
```bash
npm run dev
```
*Available at `http://localhost:5173`. Navigate to **Tasks (JWT Auth)**.*

### 3. Inspecting Background Event Stream
* Open `http://localhost:5001/events/log` in your browser or Postman to view recent background events.
* In the web UI, click **"📊 Show Analytics & Metrics"** to observe live event stream cards!

---

## 🛠️ Build & Verification

```bash
# Production bundle
npm run build

# Run linter
npm run lint
```
