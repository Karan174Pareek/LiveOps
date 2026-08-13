import { Server } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { UserWorkspaceRole } from '../models/UserWorkspaceRole.js';

// Map of active presence per workspace: workspaceId -> Map(socketId -> UserPresence)
const activePresence = new Map();

export const initSocketManager = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true
    }
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
      const workspaceId = socket.handshake.auth?.workspaceId || socket.handshake.query?.workspaceId;

      if (!token) {
        return next(new Error('Authentication failed: Missing JWT token.'));
      }

      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return next(new Error('Authentication failed: Invalid or expired token.'));
      }

      if (workspaceId) {
        const userRoleDoc = await UserWorkspaceRole.findOne({ userId: decoded.userId, workspaceId });
        if (!userRoleDoc) {
          return next(new Error('Forbidden: No access to requested workspace.'));
        }
        socket.workspaceId = workspaceId;
        socket.userRole = userRoleDoc.role;
      }

      socket.user = decoded;
      next();
    } catch (err) {
      console.error('Socket auth middleware error:', err.message);
      next(new Error('Socket authentication error'));
    }
  });

  io.on('connection', (socket) => {
    const { userId, fullName, email } = socket.user;
    const workspaceId = socket.workspaceId;

    console.log(`[Socket Connected] User: ${fullName} (${userId}) | Workspace: ${workspaceId || 'Global'}`);

    if (workspaceId) {
      const roomName = `workspace:${workspaceId}`;
      socket.join(roomName);

      // Track presence
      if (!activePresence.has(workspaceId)) {
        activePresence.set(workspaceId, new Map());
      }
      const workspacePresence = activePresence.get(workspaceId);
      workspacePresence.set(socket.id, { userId, fullName, email, online: true });

      // Broadcast presence updates
      io.to(roomName).emit('presence:update', Array.from(workspacePresence.values()));

      // Broadcast single online presence event
      socket.to(roomName).emit('presence:online', { userId, fullName, email, timestamp: new Date().toISOString() });
    }

    // Event: Switch / Join Workspace Room dynamically
    socket.on('workspace:join', async ({ workspaceId: targetWorkspaceId }) => {
      try {
        const userRoleDoc = await UserWorkspaceRole.findOne({ userId, workspaceId: targetWorkspaceId });
        if (!userRoleDoc) {
          return socket.emit('error', { message: 'Access denied to target workspace.' });
        }

        // Leave existing workspace room if any
        if (socket.workspaceId) {
          const oldRoom = `workspace:${socket.workspaceId}`;
          socket.leave(oldRoom);
          if (activePresence.has(socket.workspaceId)) {
            activePresence.get(socket.workspaceId).delete(socket.id);
            io.to(oldRoom).emit('presence:update', Array.from(activePresence.get(socket.workspaceId).values()));
          }
        }

        socket.workspaceId = targetWorkspaceId;
        socket.userRole = userRoleDoc.role;

        const newRoom = `workspace:${targetWorkspaceId}`;
        socket.join(newRoom);

        if (!activePresence.has(targetWorkspaceId)) {
          activePresence.set(targetWorkspaceId, new Map());
        }
        activePresence.get(targetWorkspaceId).set(socket.id, { userId, fullName, email, online: true });

        io.to(newRoom).emit('presence:update', Array.from(activePresence.get(targetWorkspaceId).values()));
      } catch (err) {
        console.error('Error switching workspace room:', err);
      }
    });

    // Event: Real-Time Task Actions (Broadcast to room)
    socket.on('task:moved', (data) => {
      if (!socket.workspaceId) return;
      socket.to(`workspace:${socket.workspaceId}`).emit('task:moved', {
        ...data,
        movedBy: { userId, fullName }
      });
    });

    socket.on('task:created', (data) => {
      if (!socket.workspaceId) return;
      socket.to(`workspace:${socket.workspaceId}`).emit('task:created', {
        ...data,
        createdBy: { userId, fullName }
      });
    });

    socket.on('task:updated', (data) => {
      if (!socket.workspaceId) return;
      socket.to(`workspace:${socket.workspaceId}`).emit('task:updated', {
        ...data,
        updatedBy: { userId, fullName }
      });
    });

    socket.on('task:deleted', (data) => {
      if (!socket.workspaceId) return;
      socket.to(`workspace:${socket.workspaceId}`).emit('task:deleted', {
        ...data,
        deletedBy: { userId, fullName }
      });
    });

    // Event: Live Cursor Movement (Throttled by client)
    socket.on('cursor:move', (data) => {
      if (!socket.workspaceId) return;
      socket.to(`workspace:${socket.workspaceId}`).emit('cursor:move', {
        userId,
        fullName,
        x: data.x,
        y: data.y,
        boardId: data.boardId
      });
    });

    // Disconnect Handler
    socket.on('disconnect', () => {
      if (socket.workspaceId && activePresence.has(socket.workspaceId)) {
        const workspacePresence = activePresence.get(socket.workspaceId);
        workspacePresence.delete(socket.id);
        const roomName = `workspace:${socket.workspaceId}`;

        io.to(roomName).emit('presence:update', Array.from(workspacePresence.values()));
        socket.to(roomName).emit('presence:offline', { userId, fullName, timestamp: new Date().toISOString() });
      }
      console.log(`[Socket Disconnected] User: ${fullName} (${userId})`);
    });
  });

  return io;
};
