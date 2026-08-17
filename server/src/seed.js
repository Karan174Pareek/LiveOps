import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Workspace } from './models/Workspace.js';
import { UserWorkspaceRole } from './models/UserWorkspaceRole.js';
import { Board } from './models/Board.js';
import { Task } from './models/Task.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/liveops';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to Mongo for seeding...');

    // Clear existing collections
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await UserWorkspaceRole.deleteMany({});
    await Board.deleteMany({});
    await Task.deleteMany({});

    // 1. Create User
    const passwordHash = await bcrypt.hash('Password123!', 10);
    const user = await User.create({
      fullName: 'Karan Pareek',
      email: 'karan@liveops.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    });
    console.log('Created User:', user.email);

    // Create secondary team members
    const teammate1 = await User.create({
      fullName: 'Sarah Chen',
      email: 'sarah@liveops.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    });

    const teammate2 = await User.create({
      fullName: 'Marcus Vance',
      email: 'marcus@liveops.io',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    });

    // 2. Create Workspace
    const workspace = await Workspace.create({
      name: 'Acme Core Engineering',
      slug: 'acme-core-engineering',
      ownerId: user._id
    });
    console.log('Created Workspace:', workspace.name);

    // Assign Roles
    await UserWorkspaceRole.create({ userId: user._id, workspaceId: workspace._id, role: 'admin' });
    await UserWorkspaceRole.create({ userId: teammate1._id, workspaceId: workspace._id, role: 'member' });
    await UserWorkspaceRole.create({ userId: teammate2._id, workspaceId: workspace._id, role: 'member' });

    // Secondary Workspace
    const workspace2 = await Workspace.create({
      name: 'Design & UX Studio',
      slug: 'design-ux-studio',
      ownerId: user._id
    });
    await UserWorkspaceRole.create({ userId: user._id, workspaceId: workspace2._id, role: 'admin' });

    // 3. Create Boards
    const board = await Board.create({
      workspaceId: workspace._id,
      name: 'Sprint 24 — Real-Time Engine',
      description: 'Q3 Real-time synchronization and intelligence platform enhancements',
      columns: ['Backlog', 'To Do', 'In Progress', 'Review', 'Done']
    });

    const board2 = await Board.create({
      workspaceId: workspace._id,
      name: 'Infrastructure & Security Audit',
      description: 'Hardening multi-tenant query isolation and rate limiting',
      columns: ['Backlog', 'To Do', 'In Progress', 'Review', 'Done']
    });

    console.log('Created Boards:', board.name, board2.name);

    // 4. Create Tasks
    const tasksData = [
      {
        workspaceId: workspace._id,
        boardId: board._id,
        title: 'Implement Redis pub/sub adapter for horizontal Socket.io scaling',
        description: 'Prepare cluster infrastructure for multi-node WebSocket load balancing across region nodes.',
        status: 'Backlog',
        priority: 'medium',
        assigneeIds: [teammate2._id],
        position: 0
      },
      {
        workspaceId: workspace._id,
        boardId: board._id,
        title: 'Audit OAuth2 refresh token revocation strategy',
        description: 'Verify dual-token rotation under distributed session store with httpOnly SameSite=Strict cookies.',
        status: 'Backlog',
        priority: 'low',
        assigneeIds: [user._id],
        position: 1
      },
      {
        workspaceId: workspace._id,
        boardId: board._id,
        title: 'Optimize MongoDB query indices for workspace multi-tenancy',
        description: 'Ensure compound index on workspaceId + status + position achieves sub-5ms query performance.',
        status: 'To Do',
        priority: 'high',
        assigneeIds: [user._id, teammate1._id],
        position: 0
      },
      {
        workspaceId: workspace._id,
        boardId: board._id,
        title: 'Add rate limiting middleware to AI endpoint',
        description: 'Prevent API exhaustion on /ai/summarize-standup and /ai/prioritize routes with express-rate-limit.',
        status: 'To Do',
        priority: 'urgent',
        assigneeIds: [teammate2._id],
        position: 1
      },
      {
        workspaceId: workspace._id,
        boardId: board._id,
        title: 'Build Socket.io room broadcasting for task updates',
        description: 'Emit task:moved and task:created events across workspace:id channels with real-time UI state sync.',
        status: 'In Progress',
        priority: 'urgent',
        assigneeIds: [user._id],
        position: 0
      },
      {
        workspaceId: workspace._id,
        boardId: board._id,
        title: 'Integrate Claude 3.5 Sonnet API for automated standup summaries',
        description: 'Synthesize 24h workspace activities into structured markdown bullet points for team syncs.',
        status: 'In Progress',
        priority: 'high',
        assigneeIds: [teammate1._id],
        position: 1
      },
      {
        workspaceId: workspace._id,
        boardId: board._id,
        title: 'Implement httpOnly cookie auth flow with auto-refresh interceptor',
        description: 'Axios response interceptor automatically handles 401 token refresh without disturbing user session.',
        status: 'Review',
        priority: 'high',
        assigneeIds: [user._id, teammate2._id],
        position: 0
      },
      {
        workspaceId: workspace._id,
        boardId: board._id,
        title: 'Design glassmorphic dark theme CSS token system',
        description: 'Curated HSL palette featuring dark mode visual hierarchy, glowing borders, and responsive design.',
        status: 'Done',
        priority: 'medium',
        assigneeIds: [teammate1._id],
        position: 0
      },
      {
        workspaceId: workspace._id,
        boardId: board._id,
        title: 'Setup Jest + Supertest integration test pipeline',
        description: 'Automated testing suite verifying database isolation, authentication, and WebSocket payloads.',
        status: 'Done',
        priority: 'low',
        assigneeIds: [user._id],
        position: 1
      }
    ];

    await Task.insertMany(tasksData);
    console.log('Seeded tasks successfully!');

    process.exit(0);
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
}

seed();
