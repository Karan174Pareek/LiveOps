# LiveOps — Real-Time Team Collaboration & Intelligence Platform

[![LiveOps CI Pipeline](https://github.com/Karan174Pareek/LiveOps/actions/workflows/ci.yml/badge.svg)](https://github.com/Karan174Pareek/LiveOps/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/License-MIT-purple.svg)
![Stack](https://img.shields.io/badge/Stack-MERN%20%7C%20Socket.io%20%7C%20Claude%20AI-blue.svg)

> **LiveOps** is a production-grade, multi-tenant, real-time team collaboration platform built with the MERN stack (MongoDB, Express, React, Node.js), Socket.io real-time room synchronization, and Anthropic Claude AI workspace intelligence.

---

## 🌟 Key Architecture & Features

* **⚡ Real-Time Socket.io Synchronization**: Instant broadcast of `task:moved`, `task:created`, `task:updated`, and `task:deleted` across workspace rooms (`workspace:<id>`) without page reloads.
* **👥 Live Team Presence**: Presence bar indicating active team members currently working in the workspace.
* **🛡️ Query-Level Multi-Tenancy**: Data isolation strictly enforced at the database query layer (`req.workspaceId`), preventing cross-tenant data leakage even against malicious ID enumeration.
* **🔑 Secure Dual-Token Authentication**: Short-lived Access Tokens (15 min) paired with long-lived Refresh Tokens (7 days) stored in `httpOnly` `SameSite=Strict` cookies with automated token rotation and revocation.
* **🤖 Anthropic Claude AI Copilot**:
  * `POST /ai/summarize-standup`: Automated 24h workspace activity standup summary generator.
  * `POST /ai/prioritize`: Smart board item urgency evaluator returning structured JSON priority suggestions.
* **🎨 Modern Glassmorphic Dark Design**: Custom design token system featuring dark-mode visual hierarchy, glowing accents, and responsive layout.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Lucide Icons, Axios (with auto-refresh interceptor) |
| **Backend** | Node.js, Express, Socket.io, Mongoose (MongoDB) |
| **Security & Auth** | JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `express-rate-limit` |
| **AI Layer** | Anthropic Claude 3.5 Sonnet API (`@anthropic-ai/sdk`) |
| **Testing & CI** | Jest, Supertest, GitHub Actions |

---

## 📐 Data Hierarchy & Entity Model

```
Workspace
 ├── UserWorkspaceRole (admin | member | guest)
 ├── Team
 └── Board
      └── Task (Status, Priority, Position, Assignees, Due Date)
```

For complete technical specifications, sequence diagrams, and WebSocket payload matrices, view [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🚀 Quickstart & Local Setup

### Prerequisites
* Node.js v18+ and `npm`
* MongoDB instance (Local daemon `mongodb://localhost:27017` or MongoDB Atlas URI)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Karan174Pareek/LiveOps.git
cd LiveOps

# Install server packages
cd server && npm install

# Install client packages
cd ../client && npm install
```

### 2. Environment Configuration
Copy environment templates and update values:

```bash
# Server Configuration
cp server/.env.example server/.env

# Client Configuration
cp client/.env.example client/.env
```

**`server/.env`**:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/liveops
JWT_ACCESS_SECRET=your_secure_32byte_access_secret_key
JWT_REFRESH_SECRET=your_secure_32byte_refresh_secret_key
ANTHROPIC_API_KEY=your_anthropic_claude_api_key_here
```

### 3. Launch Development Servers
In two separate terminals:

```bash
# Terminal 1: Backend Server (Port 5000)
cd server
npm run dev

# Terminal 2: Frontend Client (Port 5173)
cd client
npm run dev
```

Visit `http://localhost:5173` to register your user account and create your initial workspace!

---

## 🧪 Testing & CI Discipline

Run the automated backend test suite:

```bash
cd server
npm test
```

The repository includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automatically executes backend unit tests and validates frontend production builds on every push to `main`.

---

## 🌐 Production Deployment Guide

* **Backend (`/server`)**: Deploy to Railway, Render, or Fly.io. Configure `MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `ANTHROPIC_API_KEY`, and `CLIENT_URL`.
* **Frontend (`/client`)**: Deploy to Vercel or Netlify. Configure `VITE_API_BASE_URL` and `VITE_SOCKET_URL` to point to your live backend domain.
* **Database**: Provision a free cluster on MongoDB Atlas.

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
