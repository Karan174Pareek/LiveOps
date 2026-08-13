# LiveOps — System Architecture & Data Specification

## 1. Executive Overview

**LiveOps** is a production-grade, multi-tenant, real-time team collaboration platform built on the MERN stack (MongoDB, Express, React, Node.js) paired with Socket.io for real-time synchronization and the Anthropic Claude API for AI-assisted workspace intelligence.

---

## 2. Core Data Model & Entity Relationships

The data model establishes strict hierarchy and scoping. Every entity below `Workspace` is anchored to a `workspaceId` to guarantee query-level multi-tenant isolation.

```mermaid
erDiagram
    WORKSPACE ||--o{ TEAM : contains
    WORKSPACE ||--o{ USER_WORKSPACE_ROLE : scopes
    WORKSPACE ||--o{ BOARD : owns
    TEAM ||--o{ BOARD : manages
    BOARD ||--o{ TASK : contains
    USER ||--o{ USER_WORKSPACE_ROLE : holds
    USER ||--o{ TASK : assigned_to

    WORKSPACE {
        ObjectId _id PK
        string name
        string slug
        ObjectId ownerId FK
        datetime createdAt
    }

    USER {
        ObjectId _id PK
        string email
        string passwordHash
        string fullName
        string avatarUrl
        datetime createdAt
    }

    USER_WORKSPACE_ROLE {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId workspaceId FK
        string role "admin | member | guest"
        datetime createdAt
    }

    TEAM {
        ObjectId _id PK
        ObjectId workspaceId FK
        string name
        string description
        ObjectId[] memberIds FK
        datetime createdAt
    }

    BOARD {
        ObjectId _id PK
        ObjectId workspaceId FK
        ObjectId teamId FK
        string name
        string description
        string[] columns "e.g., Todo, In Progress, Review, Done"
        datetime createdAt
    }

    TASK {
        ObjectId _id PK
        ObjectId workspaceId FK
        ObjectId boardId FK
        string title
        string description
        string status
        string priority "low | medium | high | urgent"
        ObjectId[] assigneeIds FK
        number position
        datetime dueDate
        datetime createdAt
        datetime updatedAt
    }
```

### Key Schema Compound Indexes
To ensure fast performance and prevent cross-tenant data leakage, the database requires compound indexes on every collection:
- **`Board`**: `{ workspaceId: 1, createdAt: -1 }`
- **`Task`**: `{ workspaceId: 1, boardId: 1, position: 1 }`
- **`UserWorkspaceRole`**: `{ userId: 1, workspaceId: 1 }` (unique constraint)

---

## 3. Multi-Tenancy Strategy & Data Isolation Policy

### Query-Level Scoping Mechanism
Data isolation in LiveOps is enforced strictly at the database query layer, not just in the UI presentation layer.

1. **Workspace Context Middleware (`scopeWorkspace`)**:
   - Extracts the target `workspaceId` from HTTP headers (`X-Workspace-ID`) or request parameters.
   - Verifies the authenticated user's access rights against `UserWorkspaceRole` for that specific workspace.
   - Injects `req.workspaceId` and `req.userRole` into the Express request context.

2. **Strict Query Injection**:
   - Every database query for boards, tasks, teams, and analytics **must explicitly include `workspaceId: req.workspaceId`** in its query filter.
   - Example (Task Fetch):
     ```javascript
     // REQUIRED PATTERN
     const tasks = await Task.find({ _id: taskId, workspaceId: req.workspaceId });
     ```

3. **Cross-Tenant Security Boundary**:
   - If a user attempts to access a resource using a valid `taskId` that belongs to a workspace they are not a member of, the query returns `404 Not Found` (or `403 Forbidden`), preventing resource enumeration attacks.

---

## 4. Authentication & JWT Token Lifecycle

LiveOps uses a dual-token authentication pattern with short-lived Access Tokens and long-lived, rotated Refresh Tokens stored in secure HTTP-only cookies.

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Server as Express API
    participant DB as MongoDB / Redis

    Note over Client, Server: 1. Authentication Lifecycle
    Client->>Server: POST /auth/login { email, password }
    Server->>Server: Verify credentials (bcrypt)
    Server->>DB: Store hashed Refresh Token session
    Server-->>Client: 200 OK + JSON { accessToken (15m) } + Set-Cookie: refreshToken (7d, httpOnly, Secure, SameSite=Strict)

    Note over Client, Server: 2. Authenticated API Request
    Client->>Server: GET /boards (Header: Authorization: Bearer <accessToken>)
    Server->>Server: Verify Access Token & workspace context
    Server-->>Client: 200 OK [Boards Data]

    Note over Client, Server: 3. Token Refresh Rotation
    Client->>Server: POST /auth/refresh (Cookie: refreshToken)
    Server->>Server: Validate Refresh Token & check rotation state
    Server->>DB: Rotate refresh token & issue new family sequence
    Server-->>Client: 200 OK + JSON { newAccessToken } + Set-Cookie: newRefreshToken

    Note over Client, Server: 4. Logout Lifecycle
    Client->>Server: POST /auth/logout (Cookie: refreshToken)
    Server->>DB: Revoke Refresh Token session
    Server-->>Client: 200 OK + Clear-Cookie: refreshToken
```

### Security Tokens Breakdown
- **Access Token**: JWT signed with `JWT_ACCESS_SECRET`, payload `{ userId, email }`, expiration **15 minutes**. Sent via `Authorization: Bearer <token>`.
- **Refresh Token**: Opaque random hex / JWT signed with `JWT_REFRESH_SECRET`, expiration **7 days**. Stored in `httpOnly`, `Secure`, `SameSite=Strict` cookie.
- **Rotation Policy**: On `/auth/refresh`, the old refresh token is invalidated immediately and replaced with a new token. If an already-invalidated refresh token is presented, the system flags potential token theft and revokes all refresh tokens for that user session family.

---

## 5. WebSocket Event Map (Socket.io)

### Room Scoping Model
Upon socket handshake authentication:
1. Client submits Access Token via socket `auth` handshake object (`io({ auth: { token } })`).
2. Server validates JWT.
3. Server automatically subscribes the client socket to room `workspace:<workspaceId>`.
4. All real-time broadcasts are targeted exclusively to `workspace:<workspaceId>`.

### Complete Event Specification Matrix

| Event Name | Direction | Payload Schema | Description |
| :--- | :--- | :--- | :--- |
| `presence:online` | Server → Client | `{ userId, workspaceId, timestamp }` | Broadcast when a team member connects |
| `presence:offline` | Server → Client | `{ userId, workspaceId, timestamp }` | Broadcast when a team member disconnects |
| `cursor:move` | Client → Server → Client | `{ userId, userName, x, y, boardId }` | Throttled (20ms) cursor position update |
| `task:created` | Server → Client | `{ task: TaskObject, createdBy }` | Emitted when a new task is created |
| `task:updated` | Server → Client | `{ taskId, updates, updatedBy }` | Emitted when task details are edited |
| `task:moved` | Server → Client | `{ taskId, sourceColumn, targetColumn, newPosition, movedBy }` | Emitted when a task card is dragged/reordered |
| `task:deleted` | Server → Client | `{ taskId, boardId, deletedBy }` | Emitted when a task is removed |
| `board:updated` | Server → Client | `{ boardId, columns, updatedBy }` | Emitted when board columns or metadata change |

---

## 6. Directory Structure & Architecture Boundaries

```
LiveOps/
├── docs/
│   ├── ARCHITECTURE.md          # System Architecture & Technical Specifications
│   └── README.md                # Docs Index
├── client/                      # React + Vite Frontend
│   ├── src/
│   │   ├── components/          # UI Components (Auth, Board, Task, AI Panel)
│   │   ├── context/             # AuthContext, WorkspaceContext, SocketContext
│   │   ├── services/            # API client (Axios with auto-refresh interceptors)
│   │   ├── types/               # TypeScript interfaces
│   │   └── App.tsx
│   ├── .env.example
│   └── package.json
├── server/                      # Node.js + Express + Socket.io Backend
│   ├── src/
│   │   ├── config/              # DB connection, JWT config, CORS setup
│   │   ├── middleware/          # requireAuth, requireRole, scopeWorkspace, rateLimiter
│   │   ├── models/              # Mongoose schemas (User, Workspace, Board, Task, etc.)
│   │   ├── routes/              # Express controllers (Auth, Workspace, Board, Task, AI)
│   │   ├── sockets/             # Socket.io event handlers and room manager
│   │   ├── services/            # Claude API integration & AI prompt services
│   │   └── server.js            # Express app & Socket server entry point
│   ├── .env.example
│   └── package.json
└── .gitignore
```
