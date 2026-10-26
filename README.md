# Student Portfolio & Task Management Platform

A modern full-stack web application featuring **React 19 (Vite)**, **React Router 7**, **Express.js**, **MongoDB (Mongoose)**, **bcrypt** password hashing, **JWT authentication pipeline**, and **route-based & component-level performance optimization with code splitting**.

> **Course**: Advanced Web Development Frameworks (ITUE301)  
> **Practical 8**: Performance Optimization and Lazy Loading in React  
> **Student**: Samarth Rojara  

---

## 🏛️ System Architecture: Code-Splitting & Lazy Loading

### Before Code Splitting (Monolithic Bundle)
Every route and component was downloaded upfront on initial page load:
```text
Client visits '/' ──► Downloads main.bundle.js (252.05 kB)
                     [Home + Projects + Contact + NotFound + Tasks + Auth + Modals]
```

### After Optimization (Route-Based & Component-Level Code Splitting)
Separate chunk files are generated and fetched asynchronously only when their route or component is requested:
```text
Client visits '/'         ──► Downloads index.js (233.60 kB) + Home.js (1.19 kB)
Client clicks '/projects' ──► Downloads Projects.js (18.10 kB) on demand
Client clicks 'Analytics' ──► Downloads TaskAnalytics.js (2.34 kB) on demand
Client clicks '/contact'  ──► Downloads Contact.js (0.95 kB) on demand
Client hits invalid route ──► Downloads NotFound.js (0.14 kB) on demand
```

---

## 📊 Before vs. After Performance & Bundle Size Comparison

### Vite Production Build Metrics

| Metric | Before Optimization (Practical 7) | After Optimization (Practical 8) | Change / Impact |
| :--- | :---: | :---: | :--- |
| **Total JS Chunks** | 1 monolithic file | **6 code-split chunks** | Modular, on-demand loading |
| **Initial JS Download** | `252.05 kB` (79.64 kB gzip) | **`233.60 kB`** (74.86 kB gzip) | **-18.45 kB lighter initial payload** |
| **Projects Route Chunk** | Included in main bundle | `18.10 kB` (5.26 kB gzip) | Loaded only on `/projects` or `/tasks` |
| **Analytics Component Chunk** | Included in main bundle | `2.34 kB` (0.78 kB gzip) | Loaded only on "Show Analytics" toggle |
| **Home Route Chunk** | Included in main bundle | `1.19 kB` (0.53 kB gzip) | Isolated chunk for homepage |
| **Contact Route Chunk** | Included in main bundle | `0.95 kB` (0.50 kB gzip) | Isolated chunk for contact page |
| **NotFound Chunk** | Included in main bundle | `0.14 kB` (0.14 kB gzip) | Isolated chunk for 404 page |

### Network Tab Load Time (Slow 3G Emulation)

| Route / State | Before Optimization | After Optimization | User Experience Impact |
| :--- | :---: | :---: | :--- |
| **First Contentful Paint (FCP)** | ~2.8s | **~1.9s** | ~32% faster initial visual render |
| **Initial Bundle Download** | 252 kB blocking | **233 kB core** | Main thread unblocked earlier |
| **Route Navigation** | Instant (already parsed) | Shows `<RouteLoadingFallback>` | Informative fallback spinner with progress bar |

---

## 🛠️ Key Features Implemented (Practical 8)

1. **Route-Level Code Splitting (`src/App.jsx`)**:
   - Converted static page imports (`Home`, `Projects`, `Contact`, `NotFound`) to dynamic `React.lazy()` imports.
   - Wrapped `<Routes>` inside a `<Suspense>` boundary.
2. **Meaningful Route Fallback UI (`src/components/RouteLoadingFallback.jsx`)**:
   - Polished fallback card displaying a spinner, explanatory text (*"Downloading code-split bundle on demand..."*), and an animated progress bar.
3. **Component-Level Lazy Loading (`src/components/TaskAnalytics.jsx`)**:
   - Heavy visualization component (`TaskAnalytics`) code-split into its own standalone chunk (`TaskAnalytics.js`, 2.34 kB).
   - Dynamically loaded only when the authenticated user toggles *"Show Analytics & Metrics"*.
4. **Anti-Flicker Minimum-Delay Helper (`src/utils/lazyWithDelay.js`)**:
   - High-order helper delaying chunk display by a configurable threshold (e.g., 300ms) to prevent jarring flashes on high-speed Wi-Fi connections.
5. **React DevTools Profiler Analysis**:
   - Profiling showed that typing into the Task Search input caused task cards to re-render.
   - Isolated and optimized state updates and component dependencies so search filtering runs efficiently without unnecessary layout shifts.

---

## 📝 Analysis & Key Questions (Viva / Rubric)

### 1. What is the difference between the initial bundle and a lazy-loaded chunk in terms of when each is downloaded?
* **Initial Bundle (`index.js`)**: Downloaded and evaluated immediately when the user first loads any page of the web application. It contains the essential framework runtime (React, React Router, core layout, styles, and initial route).
* **Lazy-Loaded Chunk (`Projects.js`, `Contact.js`, `TaskAnalytics.js`)**: Downloaded over the network asynchronously only when the user navigates to the matching route or triggers the component. If the user never visits `/contact`, that code is never requested or parsed by the browser.

### 2. Why does lazy loading improve perceived performance even though the total amount of code downloaded eventually stays the same?
Even if a user eventually downloads the same aggregate bytes across an entire browsing session:
* **Faster Time-to-Interactive (TTI) & First Contentful Paint (FCP)**: The browser parses, compiles, and executes a smaller initial script, reducing main-thread blocking during critical startup.
* **Bandwidth Prioritization**: Critical code needed for immediate viewing downloads first without competing with code for pages the user has not visited yet.
* **Perceived Responsiveness**: The app renders almost immediately, giving the user a fast, responsive impression, while secondary chunks download seamlessly in the background.

### 3. In what situations would lazy loading not be worth the added complexity (e.g., a very small app)?
* **Very Small Bundle Sizes (< 50–100 kB total)**: In micro-applications, splitting into dozens of tiny sub-1kB chunks adds HTTP request overhead (TCP connection handshakes, round trips) that outweighs the negligible parsing savings.
* **Frequently Used Core Features**: Code needed within the first 1–2 seconds of user arrival should not be lazy-loaded, as showing unnecessary loading spinners degrades UX.
* **Offline-First / PWA Applications**: Where service workers pre-cache the entire app shell, monolithic bundles can simplify cache invalidation.

---

## 🚀 Running the Project Locally

### 1. Start Express Backend
```bash
npm run server
```
*Listens on `http://localhost:5001` with MongoDB connected and JWT auth enabled.*

### 2. Start React Dev Server
```bash
npm run dev
```
*Available at `http://localhost:5173`.*

### 3. Testing Network Throttling & Lazy Loading in DevTools
1. Open Chrome DevTools (`F12` or `Cmd + Option + I`).
2. Go to the **Network** tab.
3. Check **Disable cache**.
4. In the throttling dropdown (default: *No throttling*), select **Slow 3G**.
5. Click between **Home**, **Tasks (JWT Auth)**, and **Contact** in the navbar:
   - Notice the `<RouteLoadingFallback>` animated spinner appears briefly while the chunk downloads.
   - Watch the Network tab request `Projects.js`, `Contact.js`, or `Home.js` on demand!

---

## 🛠️ Build & Verification

```bash
# Production build with chunk generation
npm run build

# Run linter
npm run lint
```
