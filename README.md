# Student Portfolio & Full-Stack Task Management Platform

A high-performance full-stack web application featuring **React 19 (Vite)**, **React Router 7**, **Express.js**, **MongoDB (Mongoose)**, **bcrypt** password hashing, **JWT authentication pipeline**, **route-based code splitting**, and **server-side in-memory caching with query optimization (`node-cache`)**.

> **Course**: Advanced Web Development Frameworks (ITUE301)  
> **Practical 9**: In-Memory Caching and Query Optimization  
> **Student**: Samarth Rojara  

---

## 🏛️ System Architecture: In-Memory Caching & Query Optimization

```text
GET /tasks (or GET /tasks/:id)
       │
       ▼
 Cache Check (node-cache)
 ├── HIT  ──► Return cached memory object immediately (X-Cache: HIT) ──► ~1.9 ms
 └── MISS ──► Query MongoDB Atlas/Local ──► Store in cache (TTL: 60s) ──► Return data (X-Cache: MISS) ──► ~3.3 ms

Write Operation: POST /tasks, PUT /tasks/:id, DELETE /tasks/:id
       │
       ▼
 Write to MongoDB ──► Invalidate User & Task Cache Keys (cache.del) ──► Stale Data Prevented
```

---

## 📊 Empirical Response Time Benchmark (Cached vs. Uncached)

Tested on local environment with identical payloads and recorded across 3 repeated sample readings:

| Sample Reading | Uncached (Direct MongoDB Query) | Cached (In-Memory `node-cache`) | Header Status | Speedup |
| :---: | :---: | :---: | :---: | :---: |
| **Sample 1** | `4.05 ms` | **`1.90 ms`** | `X-Cache: HIT` | 2.1x faster |
| **Sample 2** | `3.21 ms` | **`2.21 ms`** | `X-Cache: HIT` | 1.5x faster |
| **Sample 3** | `2.64 ms` | **`1.80 ms`** | `X-Cache: HIT` | 1.5x faster |
| **Average** | **`3.30 ms`** | **`1.97 ms`** | — | **~1.7x Faster (Zero DB Latency)** |

> **Production Impact at Scale**: While a local MongoDB instance responds in 3–5ms, a production cloud cluster (like MongoDB Atlas) typically incurs 30–80ms round-trip network latency. Serving from node-cache drops response times to <2ms, representing a **15x to 40x speedup** under high concurrent traffic!

---

## 🛠️ Key Implementation Details (Practical 9)

1. **Shared Cache Instance (`cache.js`)**:
   - Initialized `node-cache` with a default TTL of 60 seconds (`stdTTL: 60`, `checkperiod: 120`).
   - Integrated a metrics collector tracking `hits`, `misses`, `writes`, `invalidations`, and `hitRatio`.
2. **User-Scoped Caching Pipeline (`server.js`)**:
   - `GET /tasks`: Checks `tasks_${req.user.id}`. Returns cached data on `HIT` (`X-Cache: HIT`), queries MongoDB and saves on `MISS` (`X-Cache: MISS`).
   - Supports cache bypassing via `?nocache=true` or header `X-No-Cache: true` for benchmarking.
3. **Single-Task Endpoint Caching (`GET /tasks/:id`)**:
   - Caches individual task documents separately under `task_${req.user.id}_${taskId}` with 60-second TTL.
4. **Cache Invalidation on Write Operations**:
   - On `POST /tasks`: Evicts `tasks_${req.user.id}`.
   - On `PUT /tasks/:id`: Evicts `tasks_${req.user.id}` and `task_${req.user.id}_${taskId}`.
   - On `DELETE /tasks/:id`: Evicts `tasks_${req.user.id}` and `task_${req.user.id}_${taskId}`.
   - Guarantees that users never view stale or out-of-sync task data after an edit or deletion.
5. **Debug & Monitoring Endpoints**:
   - `GET /cache/stats`: Returns JSON containing total hits, misses, writes, invalidations, hit ratio percentage, active keys, and node-cache internal memory stats.
   - `POST /cache/flush`: Manually clears all cached keys and resets metrics.
6. **Frontend Cache Monitor UI (`src/components/TaskAnalytics.jsx`)**:
   - Displays live server cache stats (Cache Hits, Misses, Writes, Invalidations, Hit Ratio) and provides a **Flush Cache** button directly in the web UI.

---

## 📝 Analysis & Key Questions (Viva / Rubric)

### 1. Why must the cache be invalidated on every write operation, and what would happen to data correctness if it were not?
* **Why Invalidation is Required**: Caching stores a duplicate snapshot of database records in fast RAM. Whenever a write operation occurs (`POST`, `PUT`, `DELETE`), the database state changes immediately. If the corresponding cache entry is not purged, subsequent `GET` requests will continue serving the old snapshot until the TTL expires.
* **Impact on Correctness**: Without invalidation:
  - Newly created tasks would not appear in the task list.
  - Completed or edited tasks would revert to their previous state in the UI.
  - Deleted tasks would remain visible and clickable, leading to 404 errors or phantom data.
  - Users would experience data inconsistency and lost updates.

### 2. What is a reasonable TTL (Time-To-Live) for cached data in a task management context, and what trade-off does TTL length represent?
* **Reasonable TTL**: In a task management application, **30 to 60 seconds** is an optimal TTL. Since task lists change on user actions rather than continuous real-time feeds, 60 seconds provides significant database offloading while ensuring automatic recovery even if an invalidation event were missed.
* **The TTL Trade-off**:
  - **Longer TTL (e.g., 10–30 minutes)**: Maximizes database read reduction and handles high read traffic easily, but increases the risk of serving stale data if external writes occur, and consumes more server RAM.
  - **Shorter TTL (e.g., 5–15 seconds)**: Ensures near-real-time freshness and lower memory usage, but results in frequent cache misses and higher load on the database.

### 3. Why is in-memory caching (`node-cache`) not suitable for a multi-server / multi-instance deployment, even though it works fine in this lab?
* **Process-Local Isolation**: `node-cache` stores data inside the memory heap of the specific Node.js process running the application.
* **Inconsistency in Clustered / Distributed Deployments**: If an application is scaled horizontally across 3 instances behind a load balancer (Server A, Server B, Server C):
  - A user updates a task via Server A (which invalidates Server A's local cache).
  - The next request hits Server B via the load balancer. Server B still has the stale task list in its own private memory and serves it to the user.
* **Distributed Solution**: In production multi-server architectures, a distributed shared cache like **Redis** or **Memcached** is used so all instances query and invalidate a single centralized cache layer.

---

## 🚀 Running the Project Locally

### 1. Start Express Backend API
```bash
npm run server
```
*Listens on `http://localhost:5001` with MongoDB connected and in-memory caching active.*

### 2. Start Frontend Dev Server
```bash
npm run dev
```
*Available at `http://localhost:5173`. Navigate to **Tasks (JWT Auth)**.*

### 3. Testing Cache Endpoints
* **Check Cache Stats**: `http://localhost:5001/cache/stats`
* **Test Cache HIT / MISS**: Inspect response headers in Postman or DevTools (`X-Cache: HIT` vs `X-Cache: MISS`).
* **Bypass Cache**: Add `?nocache=true` to any `GET /tasks` request.

---

## 🛠️ Build & Verification

```bash
# Production build with chunk generation
npm run build

# Run linter
npm run lint
```
