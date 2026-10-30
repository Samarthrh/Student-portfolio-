# Student Portfolio & Full-Stack Task Management Platform

[![CI Pipeline](https://github.com/Samarthrh/Student-portfolio-/actions/workflows/ci.yml/badge.svg)](https://github.com/Samarthrh/Student-portfolio-/actions/workflows/ci.yml)

A high-performance full-stack web application featuring **React 19 (Vite)**, **React Router 7**, **Express.js**, **MongoDB (Mongoose)**, **bcrypt** password hashing, **JWT authentication pipeline**, **route-based code splitting**, **in-memory caching (`node-cache`)**, **asynchronous event-driven architecture (`EventEmitter`)**, and **Automated CI/CD Pipeline via GitHub Actions**.

> **Course**: Advanced Web Development Frameworks (ITUE301)  
> **Practical 12**: CI/CD Pipeline with GitHub Actions  
> **Student**: Samarth Rojara  

---

## 🚀 CI/CD Pipeline Architecture (Practical 12)

Every push to `main` or `practical-12`, and every pull request targeting `main`, automatically triggers GitHub Actions across isolated Ubuntu Linux runners:

```text
git push origin main (or practical-12) / pull_request -> main
                            │
                            ▼
              [ GitHub Actions Trigger: on: push / pr ]
                            │
                            ▼
                ┌───────────────────────┐
                │   Job 1: lint         │ (ubuntu-latest)
                │   ├── actions/checkout │
                │   ├── setup-node (v18)│
                │   ├── npm install     │
                │   └── npm run lint    │ (Oxlint 0 errors, 0 warnings)
                └───────────┬───────────┘
                            │ (needs: lint)
                            ▼
                ┌───────────────────────┐
                │ Job 2: build-and-test │ (ubuntu-latest)
                │   ├── actions/checkout │
                │   ├── setup-node (v18)│
                │   ├── npm install     │
                │   ├── npm run build   │ (Vite client production bundle)
                │   └── npm test        │ (Jest + Supertest API test suite)
                └───────────┬───────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
   [ All Steps Passed ]            [ Any Assertion Failed ]
   Green Checkmark (✅)               Red Cross Mark (❌)
   Pipeline Status: PASSING         Pipeline Status: FAILED
   Badge: passing                   Badge: failing
```

---

## 🧪 Automated Test Suite (`tests/api.test.js`)

The test suite leverages **Jest** and **Supertest** to test critical backend endpoints and security layers:

1. **`GET /health`**: Asserts HTTP `200 OK` and payload `{ status: 'ok', auth: 'enabled' }`.
2. **`GET /cache/stats` (Practical 9)**: Asserts HTTP `200 OK` and validates cache metrics (`hits`, `misses`, `ttlSeconds: 60`).
3. **`GET /events/log` (Practical 10)**: Asserts HTTP `200 OK` and ensures asynchronous event log array is exposed.
4. **`GET /tasks` without Auth (Practical 7)**: Asserts HTTP `401 Unauthorized` and validates error payload protection.
5. **`GET /tasks` with valid JWT Token (Practical 6, 7 & 9)**: Generates a cryptographically signed JWT token, injects the authorization header (`Bearer <token>`), and asserts HTTP `200 OK` with task array data.

---

## 🛠️ GitHub Actions Workflow Configuration (`.github/workflows/ci.yml`)

The pipeline workflow incorporates:
- **Two Sequential Jobs**: `lint` runs first; `build-and-test` runs only if linting succeeds (`needs: lint`).
- **Dependency Caching & Installation**: `npm install` executed on a clean `ubuntu-latest` image.
- **Frontend Compilation**: `npm run build` verifies Vite compilation and catch build-time syntax or type errors.
- **Backend Test Runner**: `npm test` runs all automated test suites and returns non-zero exit code upon assertion failure.
- **Live Status Badge**: Embedded at the top of the README reflecting real-time pipeline state.

---

## 📝 Analysis & Key Questions (Viva / Rubric)

### 1. What is the difference between Continuous Integration (CI) and Continuous Deployment (CD), and which one does this practical actually demonstrate?
* **Continuous Integration (CI)**:
  - The automated practice where developers frequently merge code changes into a central repository, after which automated builds and tests run.
  - The objective is to detect integration bugs, compilation errors, and broken tests as early as possible.
* **Continuous Deployment (CD)**:
  - The automated extension of CI where every change that passes all stages of the pipeline is released automatically to production servers (e.g. AWS, Render, Vercel, or Kubernetes) without human intervention.
* **Which one is demonstrated**:
  - This practical demonstrates **Continuous Integration (CI)**. It automatically lints, compiles the Vite frontend, and executes the backend Jest/Supertest test suite on every push. It does not deploy the built artifacts to a production hosting environment.

### 2. Why does running tests automatically on every push catch problems earlier than testing manually before a release?
* **Immediate Feedback Loop**: A developer receives pass/fail notifications within seconds of pushing, when the changes are still fresh in their mind.
* **Pinpointed Root Cause**: When tests run on individual commits, bugs are isolated to the specific lines of code changed in that single commit rather than an entire month's worth of accumulated changes.
* **Elimination of Human Error**: Manual testing often skips edge cases, regression checks, or obscure endpoints due to fatigue or time constraints. Automated CI executes the full regression suite identically every time.
* **Prevention of "Broken Trunk"**: Broken code is intercepted before other team members pull the broken changes, preventing developer downtime.

### 3. What would happen to the pipeline if the test file path were incorrect — would the workflow fail at the same step as a genuine test failure?
* **Failure Point**:
  - If Jest is configured with a specific file path (e.g., `jest nonexistent/test.js`), Jest exits with an error (*"No tests found matching..."*) with exit code `1`.
  - The workflow will fail at the **same step** (`Run Automated Tests`), but the **underlying reason in the log is completely different**:
    - **Genuine Test Failure**: Logs show `FAIL tests/api.test.js`, displaying the failed assertion (e.g., `Expected: 200, Received: 500`).
    - **Incorrect File Path**: Logs show `Pattern nonexistent/test.js matches no files` or Jest exit with `0 tests run`.
* **Important Nuance**: If Jest is run without specific paths and discovers 0 test files across the repository, it fails by default with `passWithNoTests: false`. If `--passWithNoTests` was enabled, the pipeline would falsely report green (a dangerous false positive).

---

## 💻 Running the Checks Locally

Before pushing code to GitHub, developers can run the entire CI pipeline locally:

```bash
# 1. Run Linter
npm run lint

# 2. Compile Production Build
npm run build

# 3. Run Automated Tests
npm test
```

---

## 📸 Screenshots to Capture for Practical 12 Lab File

1. **GitHub Actions Overview**:
   - The **Actions** tab on your GitHub repository showing the list of workflow runs.
2. **Red X (Failed Pipeline)**:
   - Click on the deliberate failure run showing the red ❌ badge and the failed test assertion in the step log (`Expected: 500, Received: 200`).
3. **Green Checkmark (Passed Pipeline)**:
   - Click on the corrected run showing the green ✅ checkmark with all jobs (`lint`, `build-and-test`) passing.
4. **README Pipeline Status Badge**:
   - The top of the repository `README.md` displaying the passing status badge: `build | passing`.
